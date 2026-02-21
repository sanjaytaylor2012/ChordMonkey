import json
import logging
from mangum import Mangum
from app.main import app

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(json.dumps(event))
    return Mangum(app)(event, context)