#!/usr/bin/env python3
"""
Test image fetching from Cloudinary URLs to identify potential issues
"""

import requests
import json

def test_image_fetch():
    """Test fetching the specific image that failed"""
    
    # This is the image URL from the failing flowchart submission
    image_url = "https://res.cloudinary.com/dkmsvlhpz/image/upload/v1759818350/submissions/flowchart/algo%20_1759818350371.png"
    
    print(f"Testing image fetch from: {image_url}")
    
    try:
        response = requests.get(image_url, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        print(f"Content-Length: {response.headers.get('content-length')}")
        
        if response.status_code == 200:
            print("✅ Image fetch successful")
            
            # Try to convert to base64 like the backend does
            image_buffer = response.content
            import base64
            base64_image = base64.b64encode(image_buffer).decode('utf-8')
            print(f"Base64 conversion successful, length: {len(base64_image)}")
            
        else:
            print(f"❌ Image fetch failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception during image fetch: {e}")

def test_gemini_with_image():
    """Test Gemini AI directly with an image"""
    
    # Test with a simple image
    test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    print("\nTesting Gemini AI with image...")
    
    # Create a test submission with this image
    submission_data = {
        "studentName": "Image Test",
        "assignmentTitle": "Image Fetch Test",
        "submissionType": "flowchart",
        "imageData": test_image_base64,
        "fileName": "test.png",
        "rubricId": "f6be4d24-9bf2-4212-a30e-1d0ac05aa233"  # Use the existing rubric
    }
    
    try:
        response = requests.post("https://flowchart-grader.preview.emergentagent.com/api/submissions", 
                               json=submission_data, timeout=60)
        
        if response.status_code == 200:
            submission = response.json()
            submission_id = submission['id']
            print(f"✅ Test submission created: {submission_id}")
            
            # Monitor for a short time
            import time
            for i in range(10):
                time.sleep(2)
                detail_response = requests.get(f"https://flowchart-grader.preview.emergentagent.com/api/submissions/{submission_id}")
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    status = detail_data.get('status')
                    print(f"[{i*2}s] Status: {status}")
                    
                    if status in ['completed', 'error']:
                        if status == 'completed':
                            print("✅ Image evaluation completed successfully")
                        else:
                            print("❌ Image evaluation failed")
                        break
        else:
            print(f"❌ Failed to create test submission: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception during Gemini test: {e}")

if __name__ == "__main__":
    test_image_fetch()
    test_gemini_with_image()