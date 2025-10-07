#!/usr/bin/env python3
"""
Debug script to investigate specific evaluation errors
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "https://submit-repair-1.preview.emergentagent.com/api"

def test_specific_error_case():
    """Test the specific case that's causing errors"""
    
    # First, get the rubric that was used in the failing submissions
    rubric_response = requests.get(f"{BASE_URL}/rubrics")
    if rubric_response.status_code != 200:
        print(f"Failed to get rubrics: {rubric_response.status_code}")
        return
    
    rubrics = rubric_response.json()
    if not rubrics:
        print("No rubrics found")
        return
    
    # Find the rubric used in the error submissions
    target_rubric_id = "f6be4d24-9bf2-4212-a30e-1d0ac05aa233"
    target_rubric = None
    
    for rubric in rubrics:
        if rubric['id'] == target_rubric_id:
            target_rubric = rubric
            break
    
    if not target_rubric:
        print(f"Target rubric {target_rubric_id} not found")
        # Use the first available rubric
        target_rubric = rubrics[0]
        target_rubric_id = target_rubric['id']
    
    print(f"Using rubric: {target_rubric_id}")
    print(f"Rubric title: {target_rubric.get('title', 'N/A')}")
    
    # Test case 1: Algorithm submission similar to the failing one
    print("\n=== Testing Algorithm Submission (similar to failing case) ===")
    
    algorithm_data = {
        "studentName": "Debug Test Algorithm",
        "assignmentTitle": "Debug Algorithm Test",
        "submissionType": "algorithm",
        "textContent": """procedure bubbleSort(arr)
    n ← length of arr
    for i ← 0 to n - 1 do
        for j ← 0 to n - i - 2 do
            if arr[j] > arr[j + 1] then
                // swap arr[j] and arr[j + 1]
                temp ← arr[j]
                arr[j] ← arr[j + 1]
                arr[j + 1] ← temp
            end if
        end for
    end for
end procedure""",
        "rubricId": target_rubric_id
    }
    
    print("Creating algorithm submission...")
    response = requests.post(f"{BASE_URL}/submissions", json=algorithm_data, timeout=30)
    
    if response.status_code != 200:
        print(f"Failed to create submission: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    submission = response.json()
    submission_id = submission['id']
    print(f"Created submission: {submission_id}")
    print(f"Initial status: {submission.get('status')}")
    
    # Monitor the evaluation process closely
    print("\nMonitoring evaluation process...")
    
    for i in range(60):  # Monitor for up to 60 seconds
        time.sleep(1)
        
        detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}")
        if detail_response.status_code == 200:
            detail_data = detail_response.json()
            current_status = detail_data.get('status')
            
            print(f"[{i+1}s] Status: {current_status}")
            
            if current_status == 'completed':
                evaluation = detail_data.get('evaluation')
                if evaluation:
                    print("✅ Evaluation completed successfully!")
                    print(f"Score: {evaluation.get('totalScore')}/{evaluation.get('maxScore')}")
                else:
                    print("❌ Status is completed but no evaluation data!")
                break
            elif current_status == 'error':
                print("❌ Submission ended in error status!")
                print("Submission details:")
                print(json.dumps(detail_data, indent=2))
                break
        else:
            print(f"Error fetching submission details: {detail_response.status_code}")
    
    # Test case 2: Create a flowchart submission with a real image URL
    print("\n=== Testing Flowchart Submission (similar to failing case) ===")
    
    # Use a simple test image
    flowchart_data = {
        "studentName": "Debug Test Flowchart",
        "assignmentTitle": "Debug Flowchart Test", 
        "submissionType": "flowchart",
        "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "fileName": "debug_test.png",
        "rubricId": target_rubric_id
    }
    
    print("Creating flowchart submission...")
    response = requests.post(f"{BASE_URL}/submissions", json=flowchart_data, timeout=30)
    
    if response.status_code != 200:
        print(f"Failed to create flowchart submission: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    submission = response.json()
    submission_id = submission['id']
    print(f"Created flowchart submission: {submission_id}")
    print(f"Initial status: {submission.get('status')}")
    
    # Monitor the evaluation process
    print("\nMonitoring flowchart evaluation process...")
    
    for i in range(60):  # Monitor for up to 60 seconds
        time.sleep(1)
        
        detail_response = requests.get(f"{BASE_URL}/submissions/{submission_id}")
        if detail_response.status_code == 200:
            detail_data = detail_response.json()
            current_status = detail_data.get('status')
            
            print(f"[{i+1}s] Status: {current_status}")
            
            if current_status == 'completed':
                evaluation = detail_data.get('evaluation')
                if evaluation:
                    print("✅ Flowchart evaluation completed successfully!")
                    print(f"Score: {evaluation.get('totalScore')}/{evaluation.get('maxScore')}")
                else:
                    print("❌ Status is completed but no evaluation data!")
                break
            elif current_status == 'error':
                print("❌ Flowchart submission ended in error status!")
                print("Submission details:")
                print(json.dumps(detail_data, indent=2))
                break
        else:
            print(f"Error fetching submission details: {detail_response.status_code}")

if __name__ == "__main__":
    test_specific_error_case()