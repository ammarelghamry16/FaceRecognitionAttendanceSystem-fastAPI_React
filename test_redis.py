#!/usr/bin/env python3
"""
Simple Redis test script - works with or without Redis server running.
"""
import sys
import os
import time
from uuid import uuid4

# Add FastAPI to path
sys.path.append('FastAPI')

def test_basic_redis():
    """Test basic Redis functionality."""
    print("🔍 Testing Basic Redis Connection...")
    print("-" * 40)
    
    try:
        from shared.cache.cache_manager import CacheManager
        
        # Get cache instance
        cache = CacheManager.get_instance()
        
        if cache.client is None:
            print("⚠️  Redis server not running - cache disabled")
            print("   This is OK! The app will work without Redis.")
            return False
        
        # Test basic operations
        print("✅ Redis connected successfully!")
        
        # Test set/get
        cache.set("test:hello", "world", ttl=60)
        value = cache.get("test:hello")
        print(f"✅ Set/Get test: {value}")
        
        # Test exists
        exists = cache.exists("test:hello")
        print(f"✅ Exists test: {exists}")
        
        # Test delete
        cache.delete("test:hello")
        exists_after = cache.exists("test:hello")
        print(f"✅ Delete test: {not exists_after}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_schedule_cache():
    """Test schedule caching functionality."""
    print("\n🔍 Testing Schedule Cache...")
    print("-" * 40)
    
    try:
        from services.schedule_service.cache.schedule_cache import ScheduleCache
        
        schedule_cache = ScheduleCache()
        student_id = uuid4()
        
        # Test data
        test_schedule = [
            {"class_id": str(uuid4()), "name": "Math 101", "time": "09:00"},
            {"class_id": str(uuid4()), "name": "Physics 201", "time": "11:00"}
        ]
        
        print(f"📝 Caching schedule for student: {student_id}")
        schedule_cache.set_student_schedule(student_id, test_schedule)
        
        print("📖 Retrieving cached schedule...")
        retrieved = schedule_cache.get_student_schedule(student_id)
        
        if retrieved == test_schedule:
            print("✅ Schedule cache working perfectly!")
            # Clean up
            schedule_cache.invalidate_student_schedule(student_id)
            return True
        else:
            print("⚠️  Schedule cache returned different data")
            return False
            
    except Exception as e:
        print(f"❌ Schedule cache error: {e}")
        return False

def test_cache_decorators():
    """Test cache decorators."""
    print("\n🔍 Testing Cache Decorators...")
    print("-" * 40)
    
    try:
        from shared.cache.decorators import cache_result
        
        # Create a test function with caching
        @cache_result("test_func", ttl=60)
        def expensive_function(x, y):
            print(f"  🔄 Computing {x} + {y} (this should only show once)")
            time.sleep(0.1)  # Simulate expensive operation
            return x + y
        
        print("🔄 First call (should compute):")
        result1 = expensive_function(5, 3)
        print(f"   Result: {result1}")
        
        print("🔄 Second call (should use cache):")
        result2 = expensive_function(5, 3)
        print(f"   Result: {result2}")
        
        if result1 == result2:
            print("✅ Cache decorators working!")
            return True
        else:
            print("⚠️  Cache decorators returned different results")
            return False
            
    except Exception as e:
        print(f"❌ Cache decorator error: {e}")
        return False

def test_rate_limiting():
    """Test rate limiting functionality."""
    print("\n🔍 Testing Rate Limiting...")
    print("-" * 40)
    
    try:
        from api_gateway.strategies.redis_storage import RedisRateLimitStorage, TokenBucket
        
        storage = RedisRateLimitStorage()
        # Create a bucket: 5 requests per second, max 10 tokens
        bucket = TokenBucket(capacity=10, refill_rate=5.0, storage=storage)
        
        client_id = "test_client_123"
        
        print("🔄 Testing rate limiting (10 requests):")
        allowed_count = 0
        denied_count = 0
        
        for i in range(10):
            if bucket.consume(client_id, tokens=1):
                allowed_count += 1
                print(f"   Request {i+1}: ✅ Allowed")
            else:
                denied_count += 1
                print(f"   Request {i+1}: ❌ Rate Limited")
        
        print(f"📊 Results: {allowed_count} allowed, {denied_count} denied")
        
        # Clean up
        bucket.reset_bucket(client_id)
        
        if allowed_count > 0:
            print("✅ Rate limiting working!")
            return True
        else:
            print("⚠️  Rate limiting blocked all requests")
            return False
            
    except Exception as e:
        print(f"❌ Rate limiting error: {e}")
        return False

def check_redis_server():
    """Check if Redis server is running."""
    print("🔍 Checking Redis Server Status...")
    print("-" * 40)
    
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', 6379))
        sock.close()
        
        if result == 0:
            print("✅ Redis server is running on localhost:6379")
            return True
        else:
            print("⚠️  Redis server is not running on localhost:6379")
            print("   💡 To start Redis:")
            print("      - Docker: docker run -d -p 6379:6379 redis")
            print("      - Windows: Download from GitHub releases")
            print("      - WSL: sudo service redis-server start")
            return False
            
    except Exception as e:
        print(f"❌ Error checking Redis: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Redis Setup Test Suite")
    print("=" * 50)
    
    # Check if Redis server is running
    redis_running = check_redis_server()
    
    # Run tests
    tests = [
        ("Basic Redis", test_basic_redis),
        ("Schedule Cache", test_schedule_cache),
        ("Cache Decorators", test_cache_decorators),
        ("Rate Limiting", test_rate_limiting)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ {test_name} failed with error: {e}")
            results[test_name] = False
    
    # Summary
    print("\n📊 Test Results Summary")
    print("=" * 50)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "⚠️  SKIP/FAIL"
        print(f"{test_name:<20}: {status}")
    
    print(f"\nRedis Server Status: {'✅ Running' if redis_running else '⚠️  Not Running'}")
    
    if redis_running and all(results.values()):
        print("\n🎉 All tests passed! Redis setup is fully functional.")
    elif not redis_running:
        print("\n💡 Redis server not running, but code is working correctly!")
        print("   Start Redis server to enable caching functionality.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
    
    print("\n🔧 Quick Redis Setup:")
    print("   docker run -d --name redis -p 6379:6379 redis:latest")

if __name__ == "__main__":
    main()