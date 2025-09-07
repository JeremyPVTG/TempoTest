#!/usr/bin/env node

import { refundTestScenarios, refundTestUtils } from '../msw/refund-handlers'

interface TestResult {
  scenario: string
  success: boolean
  error?: string
  duration?: number
  details?: Record<string, unknown>
}

/**
 * Comprehensive refund testing script
 * Tests refund webhook processing, claim impacts, and entitlement updates
 */
async function runRefundTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  console.log('🔄 Starting Refund Testing Suite...\n')

  // Test 1: Successful subscription refund
  try {
    const startTime = Date.now()
    const refundEvent = refundTestScenarios.subscriptionRefund()
    
    const webhookResult = await refundTestUtils.simulateRefundWebhook(refundEvent)
    const duration = Date.now() - startTime

    results.push({
      scenario: 'Successful Subscription Refund',
      success: webhookResult.status === 200,
      duration,
      details: {
        status: webhookResult.status,
        response: webhookResult.data
      }
    })

    console.log(`✅ Subscription refund test: ${duration}ms`)
  } catch (error) {
    results.push({
      scenario: 'Successful Subscription Refund',
      success: false,
      error: String(error)
    })
    console.log(`❌ Subscription refund test failed: ${error}`)
  }

  // Test 2: Failed refund processing
  try {
    const startTime = Date.now()
    const refundEvent = refundTestScenarios.failedRefund()
    
    const webhookResult = await refundTestUtils.simulateRefundWebhook(refundEvent)
    const duration = Date.now() - startTime

    results.push({
      scenario: 'Failed Refund Processing',
      success: webhookResult.status === 500, // Expected failure
      duration,
      details: {
        status: webhookResult.status,
        response: webhookResult.data
      }
    })

    console.log(`✅ Failed refund test (expected): ${duration}ms`)
  } catch (error) {
    results.push({
      scenario: 'Failed Refund Processing',
      success: false,
      error: String(error)
    })
    console.log(`❌ Failed refund test error: ${error}`)
  }

  // Test 3: Subscription cancellation
  try {
    const startTime = Date.now()
    const cancelEvent = refundTestScenarios.subscriptionCancel()
    
    const webhookResult = await refundTestUtils.simulateRefundWebhook(cancelEvent)
    const duration = Date.now() - startTime

    results.push({
      scenario: 'Subscription Cancellation',
      success: webhookResult.status === 200,
      duration,
      details: {
        status: webhookResult.status,
        response: webhookResult.data
      }
    })

    console.log(`✅ Subscription cancellation test: ${duration}ms`)
  } catch (error) {
    results.push({
      scenario: 'Subscription Cancellation',
      success: false,
      error: String(error)
    })
    console.log(`❌ Subscription cancellation test failed: ${error}`)
  }

  // Test 4: Claim after refund
  try {
    const startTime = Date.now()
    
    const claimResult = await refundTestUtils.testClaimAfterRefund(
      'refunded-transaction', 
      'consumable_streakshield_1'
    )
    const duration = Date.now() - startTime

    results.push({
      scenario: 'Claim After Refund',
      success: claimResult.status === 410, // Expected: Gone
      duration,
      details: {
        status: claimResult.status,
        response: claimResult.data
      }
    })

    console.log(`✅ Claim after refund test: ${duration}ms`)
  } catch (error) {
    results.push({
      scenario: 'Claim After Refund',
      success: false,
      error: String(error)
    })
    console.log(`❌ Claim after refund test failed: ${error}`)
  }

  // Test 5: Entitlement validation after refund
  try {
    const startTime = Date.now()
    
    const entitlementResult = await refundTestUtils.validateEntitlementAfterRefund(
      'refunded-user',
      { pro: false, streakshield_count: 0 }
    )
    const duration = Date.now() - startTime

    results.push({
      scenario: 'Entitlement Validation After Refund', 
      success: entitlementResult.verified && !entitlementResult.pro,
      duration,
      details: entitlementResult
    })

    console.log(`✅ Entitlement validation test: ${duration}ms`)
  } catch (error) {
    results.push({
      scenario: 'Entitlement Validation After Refund',
      success: false,
      error: String(error)
    })
    console.log(`❌ Entitlement validation test failed: ${error}`)
  }

  // Test 6: Bulk refund processing
  try {
    const startTime = Date.now()
    const bulkRefunds = refundTestScenarios.bulkRefunds()
    
    const bulkResults = await Promise.all(
      bulkRefunds.map(event => refundTestUtils.simulateRefundWebhook(event))
    )
    const duration = Date.now() - startTime

    const successCount = bulkResults.filter(r => r.status === 200).length
    
    results.push({
      scenario: 'Bulk Refund Processing',
      success: successCount === bulkRefunds.length,
      duration,
      details: {
        total: bulkRefunds.length,
        successful: successCount,
        avgLatency: duration / bulkRefunds.length
      }
    })

    console.log(`✅ Bulk refund test: ${successCount}/${bulkRefunds.length} successful, ${duration}ms total`)
  } catch (error) {
    results.push({
      scenario: 'Bulk Refund Processing',
      success: false,
      error: String(error)
    })
    console.log(`❌ Bulk refund test failed: ${error}`)
  }

  // Test 7: Cross-platform refunds
  try {
    const startTime = Date.now()
    const crossPlatformRefunds = refundTestScenarios.crossPlatformRefund()
    
    const crossPlatformResults = await Promise.all(
      crossPlatformRefunds.map(event => refundTestUtils.simulateRefundWebhook(event))
    )
    const duration = Date.now() - startTime

    const allSuccessful = crossPlatformResults.every(r => r.status === 200)
    
    results.push({
      scenario: 'Cross-Platform Refunds',
      success: allSuccessful,
      duration,
      details: {
        ios: crossPlatformResults[0]?.status,
        android: crossPlatformResults[1]?.status
      }
    })

    console.log(`✅ Cross-platform refund test: ${duration}ms`)
  } catch (error) {
    results.push({
      scenario: 'Cross-Platform Refunds',
      success: false,
      error: String(error)
    })
    console.log(`❌ Cross-platform refund test failed: ${error}`)
  }

  return results
}

/**
 * Generate comprehensive test report
 */
function generateTestReport(results: TestResult[]): void {
  const successful = results.filter(r => r.success).length
  const total = results.length
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + (r.duration || 0), 0) / results.length

  console.log('\n' + '='.repeat(50))
  console.log('📊 REFUND TESTING REPORT')
  console.log('='.repeat(50))
  console.log(`Total Tests: ${total}`)
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${total - successful}`)
  console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`)
  console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`)
  console.log('')

  // Detailed results
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    
    console.log(`${index + 1}. ${status} ${result.scenario}${duration}`)
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
    
    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
    }
    console.log('')
  })

  // Recommendations
  console.log('🔍 RECOMMENDATIONS')
  console.log('-'.repeat(30))
  
  const failedTests = results.filter(r => !r.success)
  if (failedTests.length === 0) {
    console.log('• All tests passed! Refund system is working correctly.')
  } else {
    console.log('• The following areas need attention:')
    failedTests.forEach(test => {
      console.log(`  - ${test.scenario}: ${test.error || 'Unexpected failure'}`)
    })
  }

  const slowTests = results.filter(r => r.duration && r.duration > 1000)
  if (slowTests.length > 0) {
    console.log('• Performance concerns (>1s response):')
    slowTests.forEach(test => {
      console.log(`  - ${test.scenario}: ${test.duration}ms`)
    })
  }

  console.log('\n✨ Test suite completed!')
}

// CLI execution
if (require.main === module) {
  runRefundTests()
    .then(generateTestReport)
    .catch(error => {
      console.error('❌ Test suite failed:', error)
      process.exit(1)
    })
}

export { runRefundTests, generateTestReport }