#!/usr/bin/env python3
"""
Backend Testing Script for Combined Submission Functionality
Tests the specific combined submission API endpoints and data structure
"""

import requests
import json
import time
import base64
from datetime import datetime

# Get base URL from environment
import os
BASE_URL = "https://mobile-friendly-15.preview.emergentagent.com/api"

def test_combined_submission_functionality():
    """Test the combined submission functionality specifically"""
    print("=" * 80)
    print("TESTING COMBINED SUBMISSION FUNCTIONALITY")
    print("=" * 80)
    
    # Test data for combined submission
    test_data = {
        "studentName": "Alice Johnson",
        "assignmentTitle": "Factorial Algorithm Implementation",
        "submissionType": "combined",
        "algorithmContent": """def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n - 1)

# Test the function
print(factorial(5))  # Should output 120""",
        "pseudocodeContent": """BEGIN Factorial
    INPUT: n (integer)
    OUTPUT: factorial of n
    
    IF n = 0 OR n = 1 THEN
        RETURN 1
    ELSE
        RETURN n * Factorial(n-1)
    END IF
END""",
        "flowchartData": {
            "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "fileName": "factorial_flowchart.png"
        },
        "rubricId": None  # Will be set after getting rubrics
    }
    
    try:
        # Step 1: Get available rubrics
        print("\n1. GETTING AVAILABLE RUBRICS...")
        rubrics_response = requests.get(f"{BASE_URL}/rubrics", timeout=30)
        print(f"Status: {rubrics_response.status_code}")
        
        if rubrics_response.status_code == 200:
            rubrics = rubrics_response.json()
            print(f"Found {len(rubrics)} rubrics")
            
            # Find default rubric
            default_rubric = None
            for rubric in rubrics:
                if 'Default' in rubric.get('title', ''):
                    default_rubric = rubric
                    break
            
            if not default_rubric and rubrics:
                default_rubric = rubrics[0]
            
            if default_rubric:
                test_data["rubricId"] = default_rubric['id']
                print(f"Using rubric: {default_rubric['title']} (ID: {default_rubric['id']})")
            else:
                print("❌ No rubrics found - cannot test combined submission")
                return False
        else:
            print(f"❌ Failed to get rubrics: {rubrics_response.text}")
            return False
        
        # Step 2: Create combined submission
        print(f"\n2. CREATING COMBINED SUBMISSION...")
        print(f"POST {BASE_URL}/submissions")
        print(f"Data: {json.dumps({k: v if k != 'flowchartData' else {'fileName': v['fileName'], 'imageData': 'base64...'} for k, v in test_data.items()}, indent=2)}")
        
        start_time = time.time()
        submission_response = requests.post(
            f"{BASE_URL}/submissions",
            json=test_data,
            timeout=60  # Longer timeout for combined submission
        )
        end_time = time.time()
        
        print(f"Status: {submission_response.status_code}")
        print(f"Response time: {end_time - start_time:.2f}s")
        
        if submission_response.status_code != 200:
            print(f"❌ Combined submission failed: {submission_response.text}")
            return False
        
        response_data = submission_response.json()
        print(f"Response structure: {json.dumps({k: v if k != 'submissions' else f'[{len(v)} submissions]' for k, v in response_data.items()}, indent=2)}")
        
        # Verify response structure
        if response_data.get('type') != 'combined':
            print(f"❌ Expected type='combined', got: {response_data.get('type')}")
            return False
        
        combined_submission_id = response_data.get('combinedSubmissionId')
        if not combined_submission_id:
            print("❌ Missing combinedSubmissionId in response")
            return False
        
        submissions = response_data.get('submissions', [])
        if len(submissions) != 3:
            print(f"❌ Expected 3 submissions, got: {len(submissions)}")
            return False
        
        print(f"✅ Combined submission created successfully")
        print(f"Combined ID: {combined_submission_id}")
        print(f"Created {len(submissions)} submissions")
        
        # Check each submission
        submission_types = []
        for i, sub in enumerate(submissions):
            sub_type = sub.get('submissionType')
            sub_status = sub.get('status')
            sub_id = sub.get('submissionId') or sub.get('id')
            submission_types.append(sub_type)
            print(f"  {i+1}. {sub_type}: {sub_status} (ID: {sub_id})")
        
        expected_types = {'algorithm', 'pseudocode', 'flowchart'}
        actual_types = set(submission_types)
        if actual_types != expected_types:
            print(f"❌ Expected types {expected_types}, got: {actual_types}")
            return False
        
        # Step 3: Test combined retrieval
        print(f"\n3. TESTING COMBINED RETRIEVAL...")
        print(f"GET {BASE_URL}/submissions/{combined_submission_id}")
        
        retrieval_response = requests.get(f"{BASE_URL}/submissions/{combined_submission_id}", timeout=30)
        print(f"Status: {retrieval_response.status_code}")
        
        if retrieval_response.status_code != 200:
            print(f"❌ Combined retrieval failed: {retrieval_response.text}")
            return False
        
        retrieved_data = retrieval_response.json()
        print(f"Retrieved structure: {json.dumps({k: v if k != 'submissions' else f'[{len(v)} submissions]' for k, v in retrieved_data.items()}, indent=2)}")
        
        # Verify retrieved structure
        if retrieved_data.get('type') != 'combined':
            print(f"❌ Retrieved type should be 'combined', got: {retrieved_data.get('type')}")
            return False
        
        retrieved_submissions = retrieved_data.get('submissions', [])
        if len(retrieved_submissions) != 3:
            print(f"❌ Retrieved should have 3 submissions, got: {len(retrieved_submissions)}")
            return False
        
        print(f"✅ Combined retrieval successful")
        
        # Step 4: Check evaluation status and data
        print(f"\n4. CHECKING EVALUATION STATUS...")
        
        evaluation_statuses = {}
        has_evaluations = 0
        
        for sub in retrieved_submissions:
            sub_type = sub.get('submissionType')
            sub_status = sub.get('status')
            sub_evaluation = sub.get('evaluation')
            
            evaluation_statuses[sub_type] = {
                'status': sub_status,
                'has_evaluation': sub_evaluation is not None,
                'evaluation_data': sub_evaluation
            }
            
            print(f"  {sub_type}:")
            print(f"    Status: {sub_status}")
            print(f"    Has evaluation: {sub_evaluation is not None}")
            
            if sub_evaluation:
                has_evaluations += 1
                total_score = sub_evaluation.get('totalScore', 'N/A')
                max_score = sub_evaluation.get('maxScore', 'N/A')
                print(f"    Score: {total_score}/{max_score}")
                
                ai_analysis = sub_evaluation.get('aiAnalysis', {})
                if isinstance(ai_analysis, dict):
                    analysis_text = ai_analysis.get('analysis', 'No analysis')
                    print(f"    Analysis: {analysis_text[:100]}...")
                else:
                    print(f"    Analysis: {str(ai_analysis)[:100]}...")
            else:
                print(f"    ❌ No evaluation data found")
        
        print(f"\nEvaluation Summary:")
        print(f"  Submissions with evaluations: {has_evaluations}/3")
        
        if has_evaluations == 3:
            print(f"✅ All submissions have evaluations")
        elif has_evaluations > 0:
            print(f"⚠️  Partial evaluations: {has_evaluations}/3 completed")
        else:
            print(f"❌ No evaluations found - this is the main issue!")
        
        # Step 5: Test individual submission retrieval
        print(f"\n5. TESTING INDIVIDUAL SUBMISSION RETRIEVAL...")
        
        for sub in retrieved_submissions:
            sub_id = sub.get('submissionId') or sub.get('id')
            sub_type = sub.get('submissionType')
            
            print(f"\nTesting individual retrieval for {sub_type} (ID: {sub_id})")
            individual_response = requests.get(f"{BASE_URL}/submissions/{sub_id}", timeout=30)
            
            if individual_response.status_code == 200:
                individual_data = individual_response.json()
                individual_evaluation = individual_data.get('evaluation')
                print(f"  ✅ Individual retrieval successful")
                print(f"  Has evaluation: {individual_evaluation is not None}")
                
                if individual_evaluation:
                    total_score = individual_evaluation.get('totalScore', 'N/A')
                    max_score = individual_evaluation.get('maxScore', 'N/A')
                    print(f"  Score: {total_score}/{max_score}")
            else:
                print(f"  ❌ Individual retrieval failed: {individual_response.status_code}")
        
        # Step 6: Test submissions list grouping
        print(f"\n6. TESTING SUBMISSIONS LIST GROUPING...")
        
        list_response = requests.get(f"{BASE_URL}/submissions", timeout=30)
        if list_response.status_code == 200:
            all_submissions = list_response.json()
            print(f"Total submissions in list: {len(all_submissions)}")
            
            # Check if combined submissions are properly grouped
            combined_found = False
            for sub in all_submissions:
                if sub.get('combinedSubmissionId') == combined_submission_id:
                    combined_found = True
                    print(f"  Found submission with combined ID: {sub.get('submissionType')} - {sub.get('status')}")
            
            if combined_found:
                print(f"✅ Combined submissions found in list")
            else:
                print(f"❌ Combined submissions not found in list")
        else:
            print(f"❌ Failed to get submissions list: {list_response.status_code}")
        
        # Final assessment
        print(f"\n" + "=" * 80)
        print("COMBINED SUBMISSION TEST RESULTS")
        print("=" * 80)
        
        if has_evaluations == 3:
            print("✅ PASS: All combined submissions have evaluations")
            return True
        elif has_evaluations > 0:
            print("⚠️  PARTIAL: Some evaluations missing - possible timing or processing issue")
            return False
        else:
            print("❌ FAIL: No evaluations found - major issue with evaluation process")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout - server may be overloaded")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_database_schema_issue():
    """Test if the combined_submission_id column exists in database"""
    print("\n" + "=" * 80)
    print("TESTING DATABASE SCHEMA FOR COMBINED_SUBMISSION_ID")
    print("=" * 80)
    
    # Try to create a simple single submission to see if combined_submission_id field causes issues
    test_data = {
        "studentName": "Schema Test",
        "assignmentTitle": "Schema Test",
        "submissionType": "algorithm",
        "textContent": "print('test')"
    }
    
    try:
        print("Testing single submission creation (should work if schema is fixed)...")
        response = requests.post(f"{BASE_URL}/submissions", json=test_data, timeout=30)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Single submission works - schema issue may be resolved")
            return True
        else:
            error_text = response.text
            print(f"❌ Single submission failed: {error_text}")
            
            if "combined_submission_id" in error_text.lower():
                print("❌ CONFIRMED: combined_submission_id column missing from database schema")
                print("   This is the root cause of the combined submission issue")
                return False
            else:
                print("   Different error - not schema related")
                return False
                
    except Exception as e:
        print(f"❌ Error testing schema: {e}")
        return False

if __name__ == "__main__":
    print("BACKEND TESTING: Combined Submission Functionality")
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now()}")
    
    # First test if basic schema works
    schema_ok = test_database_schema_issue()
    
    if schema_ok:
        # If schema is OK, test combined functionality
        combined_ok = test_combined_submission_functionality()
        
        if combined_ok:
            print("\n🎉 ALL TESTS PASSED: Combined submission functionality working correctly")
        else:
            print("\n❌ TESTS FAILED: Combined submission has issues")
    else:
        print("\n❌ CRITICAL: Database schema issue prevents testing")
        print("   The combined_submission_id column needs to be added to the submissions table")
    
    print(f"\nTest completed at: {datetime.now()}")