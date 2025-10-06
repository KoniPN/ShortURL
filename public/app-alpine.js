// Alpine.js Component - URL Shortener
function urlShortener() {
  return {
    // State
    url: "",
    loading: false,
    result: null,
    urls: [],
    copied: false,
    refreshing: false,
    toast: {
      show: false,
      message: "",
      type: "success",
    },

    // Lifecycle
    init() {
      // Ensure loading states are false on init
      this.loading = false;
      this.refreshing = false;

      // Load URLs silently in background (non-blocking)
      setTimeout(() => {
        this.loadUrlList().catch((err) => {
          console.error("Failed to load URLs:", err);
        });
      }, 500);

      // Auto-focus on input
      setTimeout(() => {
        this.$refs.urlInput?.focus();
      }, 100);
    },

    // Form Submit
    async handleSubmit() {
      if (!this.url.trim()) {
        this.showToast("กรุณาใส่ URL", "error");
        return;
      }

      // Basic URL validation
      if (!this.isValidUrl(this.url)) {
        this.showToast(
          "รูปแบบ URL ไม่ถูกต้อง กรุณาใส่ URL ที่สมบูรณ์",
          "error"
        );
        return;
      }

      try {
        this.loading = true;

        const response = await fetch("/api/shorten", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: this.url }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "เกิดข้อผิดพลาด");
        }

        if (data.success && data.data) {
          this.result = data.data;
          this.showToast("สร้าง Short URL สำเร็จ!", "success");
          this.loadUrlList(); // Refresh list

          // Scroll to result
          setTimeout(() => {
            document.querySelector('[x-show="result"]')?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        } else {
          throw new Error("ไม่สามารถสร้าง Short URL ได้");
        }
      } catch (error) {
        console.error("Error:", error);
        this.showToast(
          error.message || "เกิดข้อผิดพลาดในการสร้าง Short URL",
          "error"
        );
      } finally {
        this.loading = false;
      }
    },

    // Copy URL
    async copyUrl() {
      try {
        await navigator.clipboard.writeText(this.result.shortUrl);
        this.copied = true;
        this.showToast("คัดลอกลิงก์แล้ว!", "success");

        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (err) {
        this.showToast("ไม่สามารถคัดลอกได้", "error");
      }
    },

    // Download QR Code
    downloadQR() {
      if (!this.result) return;

      const link = document.createElement("a");
      link.download = `qr-${this.result.shortCode}.png`;
      link.href = this.result.qrCode;
      link.click();

      this.showToast("ดาวน์โหลด QR Code แล้ว!", "success");
    },

    // Reset Form
    resetForm() {
      this.result = null;
      this.url = "";
      this.copied = false;

      // Scroll to form and focus
      setTimeout(() => {
        this.$refs.urlInput?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        this.$refs.urlInput?.focus();
      }, 100);
    },

    // Load URL List
    async loadUrlList() {
      // NEVER show loading on initial page load
      const isManualRefresh = this.urls.length > 0;

      if (isManualRefresh) {
        this.refreshing = true;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch("/api/urls", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Sort by creation date (newest first)
          this.urls = data.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        } else {
          this.urls = [];
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.error("Request timeout");
          this.showToast("โหลดข้อมูลช้าเกินไป", "error");
        } else {
          console.error("Error loading URLs:", error);
        }
        this.urls = [];
      } finally {
        // Force refreshing to false immediately
        this.refreshing = false;
      }
    },

    // Show Toast
    showToast(message, type = "success") {
      this.toast = { show: true, message, type };

      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },

    // Validate URL
    isValidUrl(url) {
      try {
        let testUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          testUrl = "https://" + url;
        }

        const urlObj = new URL(testUrl);
        return urlObj.protocol === "http:" || urlObj.protocol === "https:";
      } catch (err) {
        return false;
      }
    },

    // Format Date (Relative Time)
    formatDate(dateString) {
      if (!dateString) return "";

      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;

      // Less than 1 minute
      if (diff < 60000) return "เมื่อสักครู่";

      // Less than 1 hour
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} นาทีที่แล้ว`;
      }

      // Less than 1 day
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ชั่วโมงที่แล้ว`;
      }

      // More than 1 day
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    // Truncate URL
    truncateUrl(url, maxLength) {
      if (!url) return "";
      if (url.length <= maxLength) return url;
      return url.substring(0, maxLength - 3) + "...";
    },
  };
}
