#!/usr/bin/env python3
"""
Backend Testing for Combined Submission Feature
Tests the combined submission functionality to verify it's working correctly.
"""

import requests
import json
import time
import base64
from io import BytesIO
from PIL import Image
import os

# Configuration
BASE_URL = "https://form-submit-patch.preview.emergentagent.com/api"
TIMEOUT = 30

def create_test_image():
    """Create a small test image and return as base64"""
    # Create a simple 100x100 red square
    img = Image.new('RGB', (100, 100), color='red')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def test_api_health():
    """Test basic API connectivity"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        if response.status_code == 200:
            print("✅ API Health: PASSED - API is responding")
            return True
        else:
            print(f"❌ API Health: FAILED - Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Health: FAILED - {str(e)}")
        return False

def get_default_rubric():
    """Get the default rubric for testing"""
    print("🔍 Getting default rubric...")
    try:
        response = requests.get(f"{BASE_URL}/rubrics", timeout=TIMEOUT)
        if response.status_code == 200:
            rubrics = response.json()
            if rubrics:
                # Find default rubric or use first one
                default_rubric = None
                for rubric in rubrics:
                    if 'Default' in rubric.get('title', ''):
                        default_rubric = rubric
                        break
                
                if not default_rubric:
                    default_rubric = rubrics[0]
                
                print(f"✅ Default Rubric: Found - {default_rubric['title']} (ID: {default_rubric['id']})")
                return default_rubric['id']
            else:
                print("❌ Default Rubric: No rubrics found")
                return None
        else:
            print(f"❌ Default Rubric: Failed to fetch - Status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Default Rubric: FAILED - {str(e)}")
        return None

def test_combined_submission_creation():
    """Test creating a combined submission with all 3 types"""
    print("\n🔍 Testing Combined Submission Creation...")
    
    rubric_id = get_default_rubric()
    if not rubric_id:
        print("❌ Combined Submission Creation: FAILED - No rubric available")
        return None
    
    # Create test data
    test_image_base64 = create_test_image()
    
    payload = {
        "studentName": "Test Student",
        "assignmentTitle": "Duplicate Remover Test",
        "submissionType": "combined",
        "rubricId": rubric_id,
        "algorithmContent": """def remove_duplicates(arr):
    seen = set()
    result = []
    for item in arr:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

# Test the function
test_array = [1, 2, 2, 3, 4, 4, 5]
print(remove_duplicates(test_array))  # Should output: [1, 2, 3, 4, 5]""",
        "pseudocodeContent": """BEGIN RemoveDuplicates
    INPUT: array of elements
    OUTPUT: array without duplicates
    
    1. CREATE empty set called 'seen'
    2. CREATE empty array called 'result'
    3. FOR each item in input array:
        a. IF item is NOT in 'seen':
            i. ADD item to 'seen'
            ii. APPEND item to 'result'
    4. RETURN result
END""",
        "flowchartData": {
            "imageData": f"data:image/png;base64,{test_image_base64}",
            "fileName": "duplicate_remover_flowchart.png"
        }
    }
    
    try:
        print("📤 Sending combined submission request...")
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/submissions", json=payload, timeout=TIMEOUT)
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Combined Submission Creation: PASSED")
            print(f"   📋 Type: {data.get('type')}")
            print(f"   🔗 Combined ID: {data.get('combinedSubmissionId')}")
            print(f"   📊 Submissions count: {len(data.get('submissions', []))}")
            
            # Verify response structure
            if data.get('type') == 'combined' and data.get('combinedSubmissionId') and len(data.get('submissions', [])) == 3:
                print("✅ Response Structure: PASSED - Correct combined submission format")
                
                # Check each submission has the same combined_submission_id
                combined_id = data.get('combinedSubmissionId')
                all_have_combined_id = True
                submission_types = []
                
                for submission in data.get('submissions', []):
                    if submission.get('combinedSubmissionId') != combined_id:
                        all_have_combined_id = False
                    submission_types.append(submission.get('submissionType'))
                
                if all_have_combined_id:
                    print("✅ Combined ID Linking: PASSED - All submissions have same combined_submission_id")
                else:
                    print("❌ Combined ID Linking: FAILED - Submissions don't have matching combined_submission_id")
                
                # Check all 3 types are present
                expected_types = {'algorithm', 'pseudocode', 'flowchart'}
                if set(submission_types) == expected_types:
                    print("✅ Submission Types: PASSED - All 3 types created (algorithm, pseudocode, flowchart)")
                else:
                    print(f"❌ Submission Types: FAILED - Expected {expected_types}, got {set(submission_types)}")
                
                # Check evaluation status
                completed_count = sum(1 for s in data.get('submissions', []) if s.get('status') == 'completed')
                print(f"📊 Evaluation Status: {completed_count}/3 submissions completed")
                
                return data.get('combinedSubmissionId')
            else:
                print("❌ Response Structure: FAILED - Invalid combined submission format")
                return None
        else:
            print(f"❌ Combined Submission Creation: FAILED - Status {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Combined Submission Creation: FAILED - {str(e)}")
        return None

def test_fetch_combined_submission(combined_id):
    """Test fetching a combined submission by its combined ID"""
    print(f"\n🔍 Testing Fetch Combined Submission by ID: {combined_id}")
    
    if not combined_id:
        print("❌ Fetch Combined Submission: SKIPPED - No combined ID provided")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/submissions/{combined_id}", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Fetch Combined Submission: PASSED")
            print(f"   📋 Type: {data.get('type')}")
            print(f"   🔗 Combined ID: {data.get('combinedSubmissionId')}")
            print(f"   📊 Submissions count: {len(data.get('submissions', []))}")
            
            # Verify response structure
            if data.get('type') == 'combined' and len(data.get('submissions', [])) == 3:
                print("✅ Combined Fetch Structure: PASSED - Correct format with all 3 submissions")
                
                # Check each submission has evaluation data
                evaluations_present = 0
                for submission in data.get('submissions', []):
                    if submission.get('evaluation'):
                        evaluations_present += 1
                        print(f"   📝 {submission.get('submissionType')}: {submission.get('status')} - Evaluation present")
                    else:
                        print(f"   📝 {submission.get('submissionType')}: {submission.get('status')} - No evaluation")
                
                print(f"📊 Evaluations: {evaluations_present}/3 submissions have evaluation data")
                return True
            else:
                print("❌ Combined Fetch Structure: FAILED - Invalid response format")
                return False
        else:
            print(f"❌ Fetch Combined Submission: FAILED - Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Fetch Combined Submission: FAILED - {str(e)}")
        return False

def test_list_submissions():
    """Test listing submissions to verify combined submissions can be identified"""
    print("\n🔍 Testing List Submissions...")
    
    try:
        response = requests.get(f"{BASE_URL}/submissions", timeout=TIMEOUT)
        
        if response.status_code == 200:
            submissions = response.json()
            print(f"✅ List Submissions: PASSED - Retrieved {len(submissions)} submissions")
            
            # Look for combined submissions
            combined_submissions = []
            single_submissions = []
            
            for submission in submissions:
                if submission.get('combinedSubmissionId'):
                    combined_submissions.append(submission)
                else:
                    single_submissions.append(submission)
            
            print(f"   🔗 Combined submissions: {len(combined_submissions)}")
            print(f"   📄 Single submissions: {len(single_submissions)}")
            
            # Group combined submissions by combined_submission_id
            combined_groups = {}
            for submission in combined_submissions:
                combined_id = submission.get('combinedSubmissionId')
                if combined_id not in combined_groups:
                    combined_groups[combined_id] = []
                combined_groups[combined_id].append(submission)
            
            print(f"   📊 Combined groups: {len(combined_groups)}")
            
            # Verify each group has 3 submissions
            for combined_id, group in combined_groups.items():
                if len(group) == 3:
                    types = [s.get('submissionType') for s in group]
                    print(f"   ✅ Group {combined_id[:8]}...: 3 submissions ({', '.join(types)})")
                else:
                    print(f"   ❌ Group {combined_id[:8]}...: {len(group)} submissions (expected 3)")
            
            return True
        else:
            print(f"❌ List Submissions: FAILED - Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ List Submissions: FAILED - {str(e)}")
        return False

def test_single_submission_backwards_compatibility():
    """Test that single submissions still work as before"""
    print("\n🔍 Testing Single Submission Backwards Compatibility...")
    
    rubric_id = get_default_rubric()
    if not rubric_id:
        print("❌ Single Submission: FAILED - No rubric available")
        return False
    
    # Test algorithm submission
    payload = {
        "studentName": "Test Student Single",
        "assignmentTitle": "Single Algorithm Test",
        "submissionType": "algorithm",
        "rubricId": rubric_id,
        "textContent": """def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))"""
    }
    
    try:
        print("📤 Sending single algorithm submission...")
        response = requests.post(f"{BASE_URL}/submissions", json=payload, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Single Submission Creation: PASSED")
            print(f"   📋 Type: {data.get('submissionType')}")
            print(f"   🆔 ID: {data.get('submissionId')}")
            print(f"   📊 Status: {data.get('status')}")
            
            # Verify it doesn't have combined_submission_id
            if not data.get('combinedSubmissionId'):
                print("✅ Single Submission Format: PASSED - No combined_submission_id field")
            else:
                print("❌ Single Submission Format: FAILED - Has unexpected combined_submission_id")
                return False
            
            # Test fetching single submission
            submission_id = data.get('submissionId')
            if submission_id:
                print(f"🔍 Testing fetch single submission: {submission_id}")
                fetch_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=TIMEOUT)
                
                if fetch_response.status_code == 200:
                    fetch_data = fetch_response.json()
                    # Should return single submission format, not combined
                    if fetch_data.get('type') != 'combined':
                        print("✅ Single Submission Fetch: PASSED - Returns single submission format")
                        return True
                    else:
                        print("❌ Single Submission Fetch: FAILED - Returns combined format unexpectedly")
                        return False
                else:
                    print(f"❌ Single Submission Fetch: FAILED - Status {fetch_response.status_code}")
                    return False
            else:
                print("❌ Single Submission: FAILED - No submissionId in response")
                return False
        else:
            print(f"❌ Single Submission Creation: FAILED - Status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Single Submission: FAILED - {str(e)}")
        return False

def main():
    """Run all combined submission tests"""
    print("🚀 Starting Combined Submission Feature Testing")
    print("=" * 60)
    
    # Track test results
    results = {
        'api_health': False,
        'combined_creation': False,
        'combined_fetch': False,
        'list_submissions': False,
        'backwards_compatibility': False
    }
    
    # Test 1: API Health
    results['api_health'] = test_api_health()
    
    if not results['api_health']:
        print("\n❌ CRITICAL: API is not responding. Stopping tests.")
        return
    
    # Test 2: Combined Submission Creation
    combined_id = test_combined_submission_creation()
    results['combined_creation'] = combined_id is not None
    
    # Test 3: Fetch Combined Submission
    if combined_id:
        results['combined_fetch'] = test_fetch_combined_submission(combined_id)
    
    # Test 4: List Submissions
    results['list_submissions'] = test_list_submissions()
    
    # Test 5: Backwards Compatibility
    results['backwards_compatibility'] = test_single_submission_backwards_compatibility()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 COMBINED SUBMISSION TESTING SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall Result: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Combined submission feature is working correctly!")
    elif passed >= total * 0.8:
        print("⚠️  MOSTLY WORKING - Minor issues detected")
    else:
        print("🚨 MAJOR ISSUES - Combined submission feature needs attention")

if __name__ == "__main__":
    main()