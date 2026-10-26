"""Dedicated Celery worker; deploy separately from Namecheap shared Node servers."""
import os
from celery import Celery
redis_url=os.getenv('LANDSHOP_REDIS_URL')
if not redis_url:
    raise RuntimeError('LANDSHOP_REDIS_URL is required for the isolated worker')
celery_app=Celery('landshop_imports',broker=redis_url,backend=redis_url)
celery_app.conf.update(
    task_serializer='json',accept_content=['json'],result_serializer='json',
    task_acks_late=True,worker_prefetch_multiplier=1,
    task_time_limit=180,task_soft_time_limit=160,
    broker_connection_retry_on_startup=True,
    task_track_started=True,result_expires=86400
)
