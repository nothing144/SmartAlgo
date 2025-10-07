#!/usr/bin/env python3
"""Comprehensive test of all submission types with new Gemini API key"""

import requests
import json
import time
import base64

BASE_URL = 'http://localhost:3000/api'

def test_all_submission_types():
    print("=" * 70)
    print("COMPREHENSIVE GEMINI API TEST - ALL SUBMISSION TYPES")
    print("=" * 70)
    
    # Get rubric
    rubrics_response = requests.get(f"{BASE_URL}/rubrics", timeout=10)
    if rubrics_response.status_code != 200 or not rubrics_response.json():
        print("❌ Failed to get rubrics")
        return
    
    rubric_id = rubrics_response.json()[0]['id']
    print(f"Using rubric: {rubric_id}\n")
    
    test_cases = [
        {
            "name": "Algorithm (Bubble Sort)",
            "data": {
                "studentName": "Comprehensive Test",
                "assignmentTitle": "Bubble Sort Implementation",
                "submissionType": "algorithm",
                "textContent": """
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr

# Test
test_array = [64, 34, 25, 12, 22, 11, 90]
sorted_array = bubble_sort(test_array)
print("Sorted array:", sorted_array)
                """.strip(),
                "rubricId": rubric_id
            }
        },
        {
            "name": "Pseudocode (Quick Sort)",
            "data": {
                "studentName": "Comprehensive Test",
                "assignmentTitle": "Quick Sort Pseudocode",
                "submissionType": "pseudocode",
                "textContent": """
BEGIN QuickSort(array A, low, high)
    IF low < high THEN
        pivot_index = Partition(A, low, high)
        QuickSort(A, low, pivot_index - 1)
        QuickSort(A, pivot_index + 1, high)
    END IF
END QuickSort

BEGIN Partition(array A, low, high)
    pivot = A[high]
    i = low - 1
    
    FOR j = low TO high - 1 DO
        IF A[j] < pivot THEN
            i = i + 1
            Swap A[i] and A[j]
        END IF
    END FOR
    
    Swap A[i + 1] and A[high]
    RETURN i + 1
END Partition
                """.strip(),
                "rubricId": rubric_id
            }
        },
        {
            "name": "Flowchart (Simple image)",
            "data": {
                "studentName": "Comprehensive Test",
                "assignmentTitle": "Flowchart Test",
                "submissionType": "flowchart",
                "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "fileName": "test_flowchart.png",
                "rubricId": rubric_id
            }
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'='*70}")
        print(f"TEST {i}/3: {test_case['name']}")
        print(f"{'='*70}")
        
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/submissions", json=test_case['data'], timeout=60)
        response_time = time.time() - start_time
        
        if response.status_code == 200:
            submission = response.json()
            submission_id = submission['id']
            status = submission.get('status', 'unknown')
            
            print(f"✅ Submission created: {submission_id}")
            print(f"⏱️  Response time: {response_time:.2f}s")
            print(f"📊 Status: {status}")
            
            # Get details
            time.sleep(1)
            detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}", timeout=10)
            
            if detail_response.status_code == 200:
                detail_data = detail_response.json()
                evaluation = detail_data.get('evaluation')
                final_status = detail_data.get('status', 'unknown')
                
                if final_status == 'completed' and evaluation:
                    score = f"{evaluation.get('totalScore', 0)}/{evaluation.get('maxScore', 0)}"
                    print(f"✅ Evaluation completed successfully")
                    print(f"📊 Score: {score}")
                    
                    if evaluation.get('rubricScores'):
                        print(f"📋 Criteria scores:")
                        for score_detail in evaluation['rubricScores'][:3]:  # Show first 3
                            print(f"   • {score_detail.get('criterionName', 'N/A')}: {score_detail.get('earnedPoints', 0)}/{score_detail.get('maxPoints', 0)}")
                    
                    results.append({
                        'name': test_case['name'],
                        'success': True,
                        'score': score,
                        'response_time': response_time
                    })
                elif final_status == 'error':
                    print(f"❌ Evaluation failed with error status")
                    results.append({'name': test_case['name'], 'success': False, 'error': 'Evaluation error'})
                else:
                    print(f"⚠️  Status: {final_status}")
                    results.append({'name': test_case['name'], 'success': False, 'error': f'Status: {final_status}'})
            else:
                print(f"❌ Failed to retrieve submission details")
                results.append({'name': test_case['name'], 'success': False, 'error': 'Detail fetch failed'})
        else:
            print(f"❌ Submission failed: {response.status_code}")
            results.append({'name': test_case['name'], 'success': False, 'error': f'HTTP {response.status_code}'})
    
    # Summary
    print(f"\n{'='*70}")
    print("FINAL SUMMARY")
    print(f"{'='*70}")
    
    successful = sum(1 for r in results if r['success'])
    total = len(results)
    
    for result in results:
        if result['success']:
            print(f"✅ {result['name']}: Score {result['score']} in {result['response_time']:.2f}s")
        else:
            print(f"❌ {result['name']}: {result.get('error', 'Unknown error')}")
    
    print(f"\n{'='*70}")
    print(f"RESULT: {successful}/{total} tests passed ({successful/total*100:.1f}%)")
    print(f"{'='*70}")
    
    if successful == total:
        print("🎉 ALL SUBMISSION TYPES WORKING WITH NEW GEMINI API KEY!")
    else:
        print("⚠️  Some tests failed - review results above")
    
    return successful == total

if __name__ == "__main__":
    test_all_submission_types()
