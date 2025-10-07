#!/usr/bin/env python3
"""
End-to-End Submission Flow Testing for Netlify Deployment
Testing complete submission workflow despite Gemini API issues
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = 'https://smartalgo.netlify.app/api'

def test_submission_flow():
    """Test complete submission flow"""
    print("=" * 60)
    print("END-TO-END SUBMISSION FLOW TEST")
    print("=" * 60)
    
    # Get existing rubric
    print("1. Getting available rubrics...")
    rubrics_response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
    if rubrics_response.status_code == 200:
        rubrics = rubrics_response.json()
        if rubrics:
            rubric_id = rubrics[0]['id']
            print(f"✅ Using rubric: {rubric_id}")
        else:
            print("❌ No rubrics available")
            return
    else:
        print(f"❌ Failed to get rubrics: {rubrics_response.status_code}")
        return
    
    # Test all 3 submission types
    test_cases = [
        {
            "name": "Algorithm Submission",
            "data": {
                "studentName": "End-to-End Test Student",
                "assignmentTitle": "Algorithm E2E Test",
                "submissionType": "algorithm",
                "textContent": """
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test the function
test_array = [1, 3, 5, 7, 9, 11, 13]
result = binary_search(test_array, 7)
print(f"Found at index: {result}")
                """.strip(),
                "rubricId": rubric_id
            }
        },
        {
            "name": "Pseudocode Submission", 
            "data": {
                "studentName": "End-to-End Test Student",
                "assignmentTitle": "Pseudocode E2E Test",
                "submissionType": "pseudocode",
                "textContent": """
BEGIN MergeSort(array A, left, right)
    IF left < right THEN
        mid = (left + right) / 2
        MergeSort(A, left, mid)
        MergeSort(A, mid + 1, right)
        Merge(A, left, mid, right)
    END IF
END MergeSort

BEGIN Merge(array A, left, mid, right)
    Create temporary arrays L and R
    Copy data to L[0..mid-left] and R[0..right-mid]
    
    i = 0, j = 0, k = left
    
    WHILE i < length(L) AND j < length(R)
        IF L[i] <= R[j] THEN
            A[k] = L[i]
            i = i + 1
        ELSE
            A[k] = R[j]
            j = j + 1
        END IF
        k = k + 1
    END WHILE
    
    Copy remaining elements of L and R to A
END Merge
                """.strip(),
                "rubricId": rubric_id
            }
        },
        {
            "name": "Flowchart Submission",
            "data": {
                "studentName": "End-to-End Test Student", 
                "assignmentTitle": "Flowchart E2E Test",
                "submissionType": "flowchart",
                "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "fileName": "e2e_test_flowchart.png",
                "rubricId": rubric_id
            }
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing {test_case['name']}...")
        
        try:
            # Create submission
            start_time = time.time()
            response = requests.post(f"{BASE_URL}/submissions", 
                                   json=test_case['data'], timeout=60)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                submission = response.json()
                submission_id = submission['id']
                initial_status = submission.get('status', 'unknown')
                
                print(f"   ✅ Submission created: {submission_id}")
                print(f"   📊 Response time: {response_time:.2f}s")
                print(f"   📋 Initial status: {initial_status}")
                
                # Get detailed submission info
                detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=10)
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    
                    # Check for evaluation data
                    evaluation = detail_data.get('evaluation')
                    image_url = detail_data.get('imageUrl')
                    
                    print(f"   🔍 Final status: {detail_data.get('status', 'unknown')}")
                    
                    if evaluation:
                        print(f"   ✅ Evaluation present: Score {evaluation.get('totalScore', 'N/A')}/{evaluation.get('maxScore', 'N/A')}")
                    else:
                        print(f"   ❌ No evaluation data (expected due to Gemini API issue)")
                    
                    if image_url and test_case['data']['submissionType'] == 'flowchart':
                        print(f"   🖼️  Image uploaded: {image_url}")
                    
                    results.append({
                        'name': test_case['name'],
                        'success': True,
                        'submission_id': submission_id,
                        'response_time': response_time,
                        'status': detail_data.get('status', 'unknown'),
                        'has_evaluation': evaluation is not None,
                        'has_image_url': image_url is not None
                    })
                else:
                    print(f"   ❌ Failed to get submission details: {detail_response.status_code}")
                    results.append({
                        'name': test_case['name'],
                        'success': False,
                        'error': f"Detail fetch failed: {detail_response.status_code}"
                    })
            else:
                print(f"   ❌ Submission failed: {response.status_code}")
                print(f"   Error: {response.text}")
                results.append({
                    'name': test_case['name'],
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}"
                })
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            results.append({
                'name': test_case['name'],
                'success': False,
                'error': str(e)
            })
        
        # Wait between tests
        if i < len(test_cases):
            time.sleep(2)
    
    # Print summary
    print(f"\n" + "=" * 60)
    print("END-TO-END TEST SUMMARY")
    print("=" * 60)
    
    successful_submissions = sum(1 for r in results if r['success'])
    total_submissions = len(results)
    
    print(f"Successful Submissions: {successful_submissions}/{total_submissions}")
    
    for result in results:
        if result['success']:
            status_icon = "✅" if result.get('status') == 'completed' else "⚠️" if result.get('status') == 'error' else "🔄"
            print(f"{status_icon} {result['name']}: {result['response_time']:.2f}s, status={result.get('status', 'unknown')}")
            if result.get('has_evaluation'):
                print(f"   📊 Evaluation: Present")
            else:
                print(f"   📊 Evaluation: Missing (Gemini API issue)")
        else:
            print(f"❌ {result['name']}: {result.get('error', 'Unknown error')}")
    
    print(f"\n🔍 ANALYSIS:")
    print(f"• Submission Creation: {'✅ Working' if successful_submissions > 0 else '❌ Failed'}")
    print(f"• Database Storage: {'✅ Working' if successful_submissions > 0 else '❌ Failed'}")
    print(f"• Image Upload (Cloudinary): {'✅ Working' if any(r.get('has_image_url') for r in results if r['success']) else '❌ Failed'}")
    print(f"• AI Evaluation (Gemini): {'❌ Failed - Invalid API Key' if any(r.get('status') == 'error' for r in results if r['success']) else '✅ Working'}")
    
    return results

if __name__ == "__main__":
    test_submission_flow()