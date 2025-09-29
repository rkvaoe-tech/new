import { google } from 'googleapis'

interface GoogleSheetsConfig {
  spreadsheetId: string
  serviceAccountEmail: string
  serviceAccountPrivateKey: string
}

interface DomainRequestData {
  domain: string
  cost: number | null
  userEmail: string
  userName: string
  assignedAt: Date
}

interface MonthlyStats {
  month: string // e.g., "September 2025"
  domainCount: number
  totalCost: number
}

export class GoogleSheetsService {
  private sheets: any
  private config: GoogleSheetsConfig

  constructor(config: GoogleSheetsConfig) {
    this.config = config
    
    // Configure Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.serviceAccountEmail,
        private_key: config.serviceAccountPrivateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    this.sheets = google.sheets({ version: 'v4', auth })
  }

  /**
   * Обновляет месячную статистику доменов
   */
  async updateMonthlyStats(data: DomainRequestData): Promise<{ success: boolean; error?: string }> {
    try {
      const assignedDate = new Date(data.assignedAt)
      const monthName = assignedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      console.log('📊 Updating monthly stats for:', monthName)

      // First, try to get spreadsheet info to verify access
      console.log('🔍 Checking spreadsheet access...')
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId
      })
      console.log('✅ Spreadsheet access confirmed')

      // Check if sheet for this month exists
      const existingSheet = spreadsheet.data.sheets?.find((sheet: any) => 
        sheet.properties.title === monthName
      )

      if (!existingSheet) {
        console.log(`❌ Sheet '${monthName}' not found. Please create it first.`)
        return {
          success: false,
          error: `Sheet '${monthName}' not found. Please create it first.`
        }
      }

      const sheetId = existingSheet.properties.sheetId

      console.log(`🔍 Searching for 'Domain' cell in column A of sheet: ${monthName}`)
      
      // Get all values from column A to find "Domain" cell
      const columnAValues = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${monthName}!A:A`
      })

      if (!columnAValues.data.values) {
        console.log(`❌ No data found in column A of sheet: ${monthName}`)
        return {
          success: false,
          error: `No data found in column A of sheet: ${monthName}`
        }
      }

      // Find the row with "Domain" text
      let domainRowIndex = -1
      for (let i = 0; i < columnAValues.data.values.length; i++) {
        if (columnAValues.data.values[i][0] === 'Domain') {
          domainRowIndex = i + 1 // +1 because sheets are 1-indexed
          break
        }
      }

      if (domainRowIndex === -1) {
        console.log(`❌ 'Domain' cell not found in column A of sheet: ${monthName}`)
        return {
          success: false,
          error: `'Domain' cell not found in column A of sheet: ${monthName}`
        }
      }

      console.log(`✅ Found 'Domain' cell at row: ${domainRowIndex}`)

      // Get current values from the cells to the right of "Domain"
      const currentValues = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${monthName}!B${domainRowIndex}:C${domainRowIndex}`
      })

      const currentCount = currentValues.data.values?.[0]?.[0] || 0
      const currentTotalRaw = currentValues.data.values?.[0]?.[1] || 0

      // Parse current total, removing $ and replacing comma with dot if present
      const currentTotalStr = currentTotalRaw.toString().replace('$', '').replace(',', '.')
      const currentTotal = parseFloat(currentTotalStr) || 0

      const newCount = parseInt(currentCount.toString()) + 1
      const newTotal = currentTotal + (data.cost || 0)

      console.log(`📈 Updating: Count ${currentCount} -> ${newCount}, Total ${currentTotal} -> ${newTotal}`)

      // Update the values to the right of "Domain"
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `${monthName}!B${domainRowIndex}:C${domainRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newCount, newTotal]]
        }
      })

      // Set currency format for the total cell
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: domainRowIndex - 1, // 0-based index
                endRowIndex: domainRowIndex,
                startColumnIndex: 2, // Column C (0-based)
                endColumnIndex: 3
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'CURRENCY',
                    pattern: '$#,##0.0'
                  }
                }
              },
              fields: 'userEnteredFormat.numberFormat'
            }
          }]
        }
      })

      console.log(`✅ Successfully updated monthly stats in ${monthName}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Monthly stats update error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Записывает информацию о запросе домена в Google Sheets (legacy method)
   */
  async logDomainRequest(data: DomainRequestData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📊 Writing to Google Sheets:', {
        domain: data.domain,
        cost: data.cost,
        user: data.userEmail,
        spreadsheetId: this.config.spreadsheetId
      })

      // First, try to get spreadsheet info to verify access
      console.log('🔍 Checking spreadsheet access...')
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId
      })
      console.log('✅ Spreadsheet access confirmed')

      const values = [[
        data.domain,
        data.cost || 0,
        data.userEmail,
        data.userName,
        data.assignedAt.toISOString(),
        new Date().toISOString() // timestamp
      ]]

      console.log('📝 Appending values:', values[0])
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: 'A:F', // Use range without sheet name to work with any sheet
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values,
        },
      })

      console.log('✅ Successfully wrote to Google Sheets:', response.data)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Google Sheets error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Google Sheets error'
      }
    }
  }

  /**
   * Создает заголовки в Google Sheets (вызывается один раз при настройке)
   */
  async createHeaders(): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = [
        'Domain',
        'Cost',
        'User Email',
        'User Name',
        'Assigned At',
        'Logged At'
      ]

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: 'A1:F1', // Use range without sheet name
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      })

      console.log('✅ Headers created in Google Sheets:', response.data)
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to create headers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Создает экземпляр GoogleSheetsService с конфигурацией из переменных окружения
 */
export function createGoogleSheetsService(userSpreadsheetId?: string): GoogleSheetsService | null {
  const spreadsheetId = userSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const serviceAccountEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
  const serviceAccountPrivateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

  if (!spreadsheetId || !serviceAccountEmail || !serviceAccountPrivateKey) {
    console.log('⚠️ Google Sheets not configured - missing environment variables or user spreadsheet ID')
    return null
  }

  return new GoogleSheetsService({
    spreadsheetId,
    serviceAccountEmail,
    serviceAccountPrivateKey,
  })
}
