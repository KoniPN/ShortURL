#!/usr/bin/env python3
import boto3, json, os, time, sys
region = os.environ.get("AWS_REGION", "us-east-1")
queue_url = os.environ.get("S3_EVENTS_QUEUE_URL")
if not queue_url:
  print("Set S3_EVENTS_QUEUE_URL env var to your queue URL", file=sys.stderr)
  sys.exit(1)

sqs = boto3.client("sqs", region_name=region)
s3  = boto3.client("s3", region_name=region)

print(f"[worker] polling {queue_url} in {region}")
while True:
  resp = sqs.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=5, WaitTimeSeconds=20)
  msgs = resp.get("Messages", [])
  for m in msgs:
    body = json.loads(m["Body"])
    # Body can be raw S3 event JSON or SNS-wrapped. Try both.
    try:
      records = body.get("Records", [])
    except AttributeError:
      records = json.loads(body.get("Message", "{}")).get("Records", [])
    for r in records:
      b = r["s3"]["bucket"]["name"]
      k = r["s3"]["object"]["key"]
      print(f"[worker] processing s3://{b}/{k}")
      obj = s3.get_object(Bucket=b, Key=k)
      data = obj["Body"].read()
      # TODO: call your app / do processing here
      print(f"[worker] size={len(data)} bytes")
    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=m["ReceiptHandle"])
  time.sleep(1)
