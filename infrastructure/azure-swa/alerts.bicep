// Azure Monitor Alert Rules for ApiForge SWA
// Deploy using: az deployment group create --resource-group apiforge-rg --template-file alerts.bicep

@description('Name of the Application Insights instance')
param appInsightsName string

@description('Resource ID of the Application Insights instance')
param appInsightsResourceId string

@description('Action group resource ID for notifications')
param actionGroupId string

@description('Environment name (preview or production)')
@allowed([
  'preview'
  'production'
])
param environment string = 'production'

// P95 Latency Alert
resource latencyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'apiforge-${environment}-p95-latency'
  location: 'global'
  properties: {
    description: 'Alert when P95 request latency exceeds 2 seconds'
    severity: 2
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'P95Latency'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 2000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
          dimensions: [
            {
              name: 'request/performanceBucket'
              operator: 'Include'
              values: ['*']
            }
          ]
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
      }
    ]
  }
}

// Error Rate Alert
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'apiforge-${environment}-error-rate'
  location: 'global'
  properties: {
    description: 'Alert when error rate exceeds 5% over 5 minutes'
    severity: 1
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
      }
    ]
  }
}

// Cold Start Alert
resource coldStartAlert 'Microsoft.Insights/scheduledQueryRules@2021-08-01' = {
  name: 'apiforge-${environment}-cold-starts'
  location: resourceGroup().location
  properties: {
    description: 'Alert when cold starts exceed threshold'
    severity: 3
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: 'traces | where message contains "cold start" or customDimensions.coldStart == "true" | summarize count() by bin(timestamp, 5m) | where count_ > 10'
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 10
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroupId
      ]
    }
  }
}

// Exception Count Alert
resource exceptionAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'apiforge-${environment}-exceptions'
  location: 'global'
  properties: {
    description: 'Alert when exception count exceeds threshold'
    severity: 2
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ExceptionCount'
          metricName: 'exceptions/count'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
      }
    ]
  }
}

// Availability Alert
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'apiforge-${environment}-availability'
  location: 'global'
  properties: {
    description: 'Alert when availability drops below 95%'
    severity: 1
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Availability'
          metricName: 'availabilityResults/availabilityPercentage'
          metricNamespace: 'microsoft.insights/components'
          operator: 'LessThan'
          threshold: 95
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
      }
    ]
  }
}

output latencyAlertId string = latencyAlert.id
output errorRateAlertId string = errorRateAlert.id
output coldStartAlertId string = coldStartAlert.id
output exceptionAlertId string = exceptionAlert.id
output availabilityAlertId string = availabilityAlert.id
