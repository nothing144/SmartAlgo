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
BASE_URL = "https://form-submit-patch.preview.emergentagent.com/api"

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