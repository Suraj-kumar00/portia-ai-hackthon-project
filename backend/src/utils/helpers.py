"""Utility helper functions"""
from typing import Dict, Any, List, Optional, Union
import uuid
import re
import hashlib
from datetime import datetime, timedelta
import json

def generate_unique_id(prefix: str = "") -> str:
    """Generate unique ID with optional prefix"""
    unique_id = str(uuid.uuid4())
    return f"{prefix}_{unique_id}" if prefix else unique_id

def sanitize_string(text: str, max_length: int = 255) -> str:
    """Sanitize and validate string input"""
    if not isinstance(text, str):
        return ""
    
    # Remove special characters but keep spaces and basic punctuation
    sanitized = re.sub(r'[^\w\s\-\.,!?@]', '', text)
    
    # Normalize whitespace
    sanitized = ' '.join(sanitized.split())
    
    # Truncate to max length
    return sanitized[:max_length].strip()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def format_phone_number(phone: str) -> Optional[str]:
    """Format and validate phone number"""
    if not phone:
        return None
    
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Basic validation (10-15 digits)
    if len(digits) < 10 or len(digits) > 15:
        return None
    
    # Format as international number
    if len(digits) == 10:
        return f"+1{digits}"  # Assume US number
    elif digits.startswith('1') and len(digits) == 11:
        return f"+{digits}"
    else:
        return f"+{digits}"

def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data for logging/tracking"""
    return hashlib.sha256(data.encode()).hexdigest()[:16]

def mask_email(email: str) -> str:
    """Mask email for logging while keeping it recognizable"""
    if '@' not in email:
        return email[:2] + '*' * (len(email) - 2)
    
    username, domain = email.split('@', 1)
    if len(username) <= 2:
        masked_username = username[0] + '*'
    else:
        masked_username = username + '*' * (len(username) - 2) + username[-1]
    
    return f"{masked_username}@{domain}"

def calculate_confidence_score(factors: Dict[str, float], weights: Dict[str, float]) -> float:
    """Calculate confidence score based on multiple factors"""
    
    total_weighted_score = 0.0
    total_weight = 0.0
    
    for factor, score in factors.items():
        if factor in weights:
            weight = weights[factor]
            total_weighted_score += score * weight
            total_weight += weight
    
    if total_weight == 0:
        return 0.0
    
    return round(total_weighted_score / total_weight, 3)

def parse_time_duration(duration_str: str) -> Optional[timedelta]:
    """Parse time duration string (e.g., '2h 30m', '1d', '45s')"""
    
    if not duration_str:
        return None
    
    # Regex patterns for different time units
    patterns = {
        'days': r'(\d+)d',
        'hours': r'(\d+)h',
        'minutes': r'(\d+)m',
        'seconds': r'(\d+)s'
    }
    
    total_seconds = 0
    
    for unit, pattern in patterns.items():
        match = re.search(pattern, duration_str.lower())
        if match:
            value = int(match.group(1))
            if unit == 'days':
                total_seconds += value * 86400
            elif unit == 'hours':
                total_seconds += value * 3600
            elif unit == 'minutes':
                total_seconds += value * 60
            elif unit == 'seconds':
                total_seconds += value
    
    return timedelta(seconds=total_seconds) if total_seconds > 0 else None

def format_time_ago(dt: datetime) -> str:
    """Format datetime as 'time ago' string"""
    
    now = datetime.utcnow()
    if dt > now:
        return "in the future"
    
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    
    hours = diff.seconds // 3600
    if hours > 0:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    
    minutes = (diff.seconds % 3600) // 60
    if minutes > 0:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    
    return "just now"

def extract_keywords(text: str, min_length: int = 3) -> List[str]:
    """Extract keywords from text"""
    
    if not text:
        return []
    
    # Remove punctuation and convert to lowercase
    cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
    
    # Split into words and filter by length
    words = [
        word.strip() for word in cleaned.split() 
        if len(word.strip()) >= min_length
    ]
    
    # Remove common stop words
    stop_words = {
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
        'those', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can'
    }
    
    keywords = [word for word in words if word not in stop_words]
    
    # Remove duplicates while preserving order
    seen = set()
    unique_keywords = []
    for keyword in keywords:
        if keyword not in seen:
            seen.add(keyword)
            unique_keywords.append(keyword)
    
    return unique_keywords

def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """Safely parse JSON string with fallback"""
    
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default

def safe_json_dumps(obj: Any, default: str = "{}") -> str:
    """Safely serialize object to JSON with fallback"""
    
    try:
        return json.dumps(obj, default=str)
    except (TypeError, ValueError):
        return default

def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split list into chunks of specified size"""
    
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def flatten_dict(d: Dict[str, Any], separator: str = '.') -> Dict[str, Any]:
    """Flatten nested dictionary"""
    
    def _flatten(obj, prefix=''):
        if isinstance(obj, dict):
            for key, value in obj.items():
                new_key = f"{prefix}{separator}{key}" if prefix else key
                yield from _flatten(value, new_key)
        else:
            yield prefix, obj
    
    return dict(_flatten(d))

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate simple text similarity score (0.0 to 1.0)"""
    
    if not text1 or not text2:
        return 0.0
    
    # Convert to lowercase and split into words
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    # Calculate Jaccard similarity
    intersection = words1 & words2
    union = words1 | words2
    
    if not union:
        return 0.0
    
    return len(intersection) / len(union)

class Timer:
    """Context manager for timing operations"""
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.duration = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time
    
    @property
    def duration_ms(self) -> float:
        """Get duration in milliseconds"""
        return self.duration * 1000 if self.duration else 0.0

def retry_operation(max_attempts: int = 3, delay_seconds: float = 1.0):
    """Decorator for retrying operations with exponential backoff"""
    
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise e
                    
                    wait_time = delay_seconds * (2 ** attempt)
                    time.sleep(wait_time)
            
        return wrapper
    return decorator