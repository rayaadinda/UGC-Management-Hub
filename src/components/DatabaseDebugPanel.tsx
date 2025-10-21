import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { runDatabaseDiagnostics, createSampleData, testRecordAccess } from '@/utils/databaseDiagnostic'

export function DatabaseDebugPanel() {
  const [diagnostic, setDiagnostic] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setLastError(null)

    try {
      const result = await runDatabaseDiagnostics()
      setDiagnostic(result)
      console.log('Database Diagnostic Results:', result)
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unknown error')
      console.error('Diagnostic failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const createData = async () => {
    setIsRunning(true)
    try {
      const success = await createSampleData()
      if (success) {
        await runDiagnostics() // Refresh diagnostics
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  const testSpecificRecord = async (table: string, id: string) => {
    setIsRunning(true)
    try {
      const success = await testRecordAccess(table, id)
      console.log(`Test ${table}/${id} result:`, success)
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (exists: boolean) => {
    return exists ? (
      <Badge className="bg-green-100 text-green-800">Exists</Badge>
    ) : (
      <Badge variant="destructive">Missing</Badge>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Diagnostics
          </CardTitle>
          <CardDescription>
            Check database status and fix common issues with Instagram scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Display */}
          {lastError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{lastError}</AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={isRunning}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button variant="outline" onClick={createData} disabled={isRunning}>
              Create Sample Data
            </Button>
          </div>

          {/* Diagnostic Results */}
          {diagnostic && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostic.success)}
                  <span className="font-medium">Overall Status</span>
                </div>
                {getStatusBadge(diagnostic.success)}
              </div>

              {/* Table Status */}
              <div className="space-y-2">
                <h4 className="font-medium">Table Status</h4>

                {Object.entries(diagnostic.tables).map(([tableName, info]: any) => (
                  <div key={tableName} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(info.exists)}
                      <div>
                        <span className="font-medium">{tableName}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({info.count} records)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(info.exists)}
                      {info.sampleId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testSpecificRecord(tableName, info.sampleId)}
                        >
                          Test
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Issues */}
              {diagnostic.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-600">Issues Found</h4>
                  <div className="space-y-1">
                    {diagnostic.issues.map((issue: string, index: number) => (
                      <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {diagnostic.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600">Recommendations</h4>
                  <div className="space-y-1">
                    {diagnostic.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tests</CardTitle>
          <CardDescription>
            Test specific functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => testSpecificRecord('ugc_content', '00000000-0000-0000-0000-000000000000')}
              disabled={isRunning}
            >
              Test ugc_content with dummy ID
            </Button>
            <Button
              variant="outline"
              onClick={() => testSpecificRecord('ugc_content', diagnostic?.tables?.ugc_content?.sampleId)}
              disabled={isRunning}
            >
              Test ugc_content with sample ID
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}