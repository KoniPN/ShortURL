resource "aws_lb" "alb" {
  name               = "${var.project}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  security_groups    = [aws_security_group.alb_sg.id]
}

resource "aws_lb_target_group" "tg" {
  name     = "${var.project}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg.arn
  }
}

# ---------------- Launch Template ----------------
resource "aws_launch_template" "lt" {
  name_prefix            = "${var.project}-lt-"
  image_id               = var.ami_id
  instance_type          = "t3.micro"
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  
  # เพิ่ม IAM Instance Profile (ใช้ LabRole)
  iam_instance_profile {
    name = "LabInstanceProfile"
  }
  
  user_data = base64encode(<<EOF
#!/bin/bash
set -euo pipefail
LOG=/var/log/user-data.log
exec > >(tee -a "$LOG") 2>&1

echo "[$(date)] ========== Starting URL Shortener Backend Setup =========="

# 1. Install Node.js 20.x + PM2
echo "[$(date)] Installing Node.js 20 and PM2..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
yum install -y nodejs git
npm install -g pm2

# 2. Clone repository
echo "[$(date)] Cloning repository..."
cd /home/ec2-user
git clone https://github.com/KoniPN/ShortURL.git
cd ShortURL/backend

# 3. Install dependencies
echo "[$(date)] Installing dependencies..."
npm install

# 4. Build TypeScript
echo "[$(date)] Building TypeScript..."
npm run build

EOF
  )
}

# ---------------- Auto Scaling Group ----------------
resource "aws_autoscaling_group" "asg" {
  min_size            = 1
  max_size            = var.instance_count
  desired_capacity    = 1
  vpc_zone_identifier = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  target_group_arns   = [aws_lb_target_group.tg.arn]

  launch_template {
    id      = aws_launch_template.lt.id
    version = "$Latest"
  }
}