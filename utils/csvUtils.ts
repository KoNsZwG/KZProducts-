/**
 * CSV Utilities for Product Import/Export
 * Handles parsing, generating, and validating CSV data
 */

export interface CsvParseResult {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
}

export interface CsvValidationError {
  row: number
  field: string
  message: string
}

/**
 * Parse CSV content string into structured data
 * Handles quoted fields, commas within quotes, and newlines
 */
export function parseCSV(content: string): CsvParseResult {
  const errors: string[] = []
  const lines = content.trim().split(/\r?\n/)
  
  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['CSV file is empty'] }
  }

  // Parse header row
  const headers = parseCsvLine(lines[0])
  
  if (headers.length === 0) {
    return { headers: [], rows: [], errors: ['No headers found in CSV'] }
  }

  // Parse data rows
  const rows: Record<string, string>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    const values = parseCsvLine(line)
    
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Expected ${headers.length} columns but found ${values.length}`)
      continue
    }
    
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    rows.push(row)
  }

  return { headers, rows, errors }
}

/**
 * Parse a single CSV line, handling quoted fields properly
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Don't forget the last field
  result.push(current)
  
  return result
}

/**
 * Escape a field for CSV with formula injection protection
 * Prevents Excel/Sheets formula execution attacks
 */
function escapeCSVField(value: string): string {
  let escaped = String(value)
  
  // Formula injection protection
  // Prefix with single quote if starts with formula characters
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = `'${escaped}`
  }
  
  // Standard CSV escaping
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped.replace(/"/g, '""')}"`
  }
  return escaped
}

/**
 * Generate CSV string from array of objects
 */
export function generateCSV(data: Record<string, any>[], columns: string[]): string {
  // Header row
  const headerRow = columns.map(col => escapeCSVField(col)).join(',')
  
  // Data rows
  const dataRows = data.map(item => {
    return columns.map(col => {
      const value = item[col]
      if (value === null || value === undefined) {
        return ''
      }
      // Handle arrays (like images)
      if (Array.isArray(value)) {
        return escapeCSVField(value.join(','))
      }
      return escapeCSVField(String(value))
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Read a File object as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Normalize boolean values from CSV
 */
export function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim()
  return ['true', 'yes', '1', 'active'].includes(normalized)
}

/**
 * Parse numeric value with validation
 */
export function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null
  const num = parseFloat(value.replace(',', '.'))
  return isNaN(num) ? null : num
}

/**
 * Parse image URLs from comma-separated string
 * Now includes URL validation for security
 */
export function parseImageUrls(value: string): string[] {
  if (!value || value.trim() === '') return []
  return value
    .split(',')
    .map(url => validateImageUrl(url.trim()))
    .filter((url): url is string => url !== null)
}

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Maximum allowed file size for CSV imports (5MB)
 */
export const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024

/**
 * Maximum allowed rows in a CSV import
 */
export const MAX_CSV_ROWS = 1000

/**
 * Sanitize string to prevent XSS attacks
 * Removes or escapes potentially dangerous content
 */
export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') return ''
  
  return value
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content (can contain expressions)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove event handlers (onclick, onerror, onload, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove vbscript: URLs
    .replace(/vbscript\s*:/gi, '')
    // Remove data: URLs (can contain scripts)
    .replace(/data\s*:/gi, 'data-blocked:')
    // Escape HTML angle brackets
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Trim excessive whitespace
    .trim()
}

/**
 * Validate and sanitize image URLs
 * Only allows http/https protocols, rejects dangerous URLs
 */
export function validateImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  
  const trimmed = url.trim()
  
  // Must start with http:// or https://
  if (!trimmed.match(/^https?:\/\//i)) {
    return null
  }
  
  // Block dangerous URL schemes hidden in the URL
  const lowerUrl = trimmed.toLowerCase()
  if (
    lowerUrl.includes('javascript:') ||
    lowerUrl.includes('vbscript:') ||
    lowerUrl.includes('data:') ||
    lowerUrl.includes('<script') ||
    lowerUrl.includes('onerror=') ||
    lowerUrl.includes('onload=')
  ) {
    return null
  }
  
  try {
    const parsed = new URL(trimmed)
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    
    // Return the sanitized URL
    return parsed.href
  } catch {
    return null // Invalid URL format
  }
}

/**
 * Validate UUID format
 * Accepts UUID v1-v5 format
 */
export function isValidUUID(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value.trim())
}

/**
 * Sanitize and validate slug
 * Only allows lowercase alphanumeric and hyphens
 */
export function sanitizeSlug(value: string): string {
  if (!value || typeof value !== 'string') return ''
  
  return value
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all characters except alphanumeric and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 100)
}

/**
 * Validate file before parsing
 * Returns error message or null if valid
 */
export function validateCsvFile(file: File): string | null {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'Invalid file type. Please upload a CSV file.'
  }
  
  // Check file size
  if (file.size > MAX_CSV_FILE_SIZE) {
    const maxMB = Math.round(MAX_CSV_FILE_SIZE / 1024 / 1024)
    return `File too large. Maximum size is ${maxMB}MB.`
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return 'File is empty.'
  }
  
  return null
}

