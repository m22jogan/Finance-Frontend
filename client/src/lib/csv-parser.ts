export interface CSVTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId?: string;
}

export interface CSVParseResult {
  transactions: CSVTransaction[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface CSVParseOptions {
  dateFormats?: string[];
  amountColumn?: string;
  descriptionColumn?: string;
  dateColumn?: string;
  typeColumn?: string;
  delimiter?: string;
  hasHeader?: boolean;
}

export class CSVParser {
  private static readonly DEFAULT_DATE_FORMATS = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
    'MM-DD-YYYY',
    'DD-MM-YYYY'
  ];

  private static readonly DEFAULT_CATEGORIES = {
    'cat-1': ['restaurant', 'food', 'dining', 'starbucks', 'coffee', 'pizza', 'burger', 'meal'],
    'cat-2': ['gas', 'fuel', 'uber', 'lyft', 'transport', 'taxi', 'bus', 'train', 'parking'],
    'cat-3': ['movie', 'entertainment', 'netflix', 'spotify', 'game', 'concert', 'theater'],
    'cat-4': ['amazon', 'shopping', 'store', 'mall', 'purchase', 'buy', 'retail'],
    'cat-5': ['salary', 'income', 'deposit', 'payroll', 'payment', 'refund', 'cashback']
  };

  static parseCSV(csvContent: string, options: CSVParseOptions = {}): CSVParseResult {
    const {
      delimiter = ',',
      hasHeader = true,
      dateColumn = 'date',
      descriptionColumn = 'description',
      amountColumn = 'amount',
      typeColumn = 'type'
    } = options;

    const lines = csvContent.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    const transactions: CSVTransaction[] = [];

    if (lines.length === 0) {
      return {
        transactions: [],
        errors: ['CSV file is empty'],
        totalRows: 0,
        validRows: 0
      };
    }

    let headerRow: string[] = [];
    let dataStartIndex = 0;

    if (hasHeader) {
      headerRow = this.parseCSVLine(lines[0], delimiter);
      dataStartIndex = 1;
    } else {
      // Assume standard order: date, description, amount, type
      headerRow = [dateColumn, descriptionColumn, amountColumn, typeColumn];
    }

    // Find column indices
    const dateIndex = this.findColumnIndex(headerRow, [dateColumn, 'date', 'transaction_date', 'trans_date']);
    const descriptionIndex = this.findColumnIndex(headerRow, [descriptionColumn, 'description', 'memo', 'details', 'reference']);
    const amountIndex = this.findColumnIndex(headerRow, [amountColumn, 'amount', 'value', 'transaction_amount']);
    const typeIndex = this.findColumnIndex(headerRow, [typeColumn, 'type', 'transaction_type', 'debit_credit']);

    if (dateIndex === -1) {
      errors.push('Date column not found. Expected columns: date, transaction_date, trans_date');
    }
    if (descriptionIndex === -1) {
      errors.push('Description column not found. Expected columns: description, memo, details, reference');
    }
    if (amountIndex === -1) {
      errors.push('Amount column not found. Expected columns: amount, value, transaction_amount');
    }

    // Parse data rows
    for (let i = dataStartIndex; i < lines.length; i++) {
      const rowIndex = i + 1;
      const values = this.parseCSVLine(lines[i], delimiter);

      if (values.length < Math.max(dateIndex, descriptionIndex, amountIndex) + 1) {
        errors.push(`Row ${rowIndex}: Insufficient columns`);
        continue;
      }

      try {
        const transaction = this.parseTransaction(values, {
          dateIndex,
          descriptionIndex,
          amountIndex,
          typeIndex,
          rowIndex
        });

        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        errors.push(`Row ${rowIndex}: ${error}`);
      }
    }

    return {
      transactions,
      errors,
      totalRows: lines.length - dataStartIndex,
      validRows: transactions.length
    };
  }

  private static parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map(value => value.replace(/^"|"$/g, ''));
  }

  private static findColumnIndex(headers: string[], possibleNames: string[]): number {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    for (const name of possibleNames) {
      const index = normalizedHeaders.findIndex(h => 
        h === name.toLowerCase() || 
        h.includes(name.toLowerCase()) ||
        name.toLowerCase().includes(h)
      );
      if (index !== -1) return index;
    }
    
    return -1;
  }

  private static parseTransaction(
    values: string[], 
    indices: {
      dateIndex: number;
      descriptionIndex: number;
      amountIndex: number;
      typeIndex: number;
      rowIndex: number;
    }
  ): CSVTransaction | null {
    const { dateIndex, descriptionIndex, amountIndex, typeIndex, rowIndex } = indices;

    // Parse date
    const dateStr = values[dateIndex]?.trim();
    if (!dateStr) {
      throw new Error('Date is required');
    }

    const date = this.parseDate(dateStr);
    if (!date) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Parse description
    const description = values[descriptionIndex]?.trim();
    if (!description) {
      throw new Error('Description is required');
    }

    // Parse amount
    const amountStr = values[amountIndex]?.trim();
    if (!amountStr) {
      throw new Error('Amount is required');
    }

    const amount = this.parseAmount(amountStr);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountStr}`);
    }

    // Parse type
    let type: 'income' | 'expense' = 'expense';
    
    if (typeIndex !== -1 && values[typeIndex]) {
      const typeStr = values[typeIndex].toLowerCase().trim();
      if (typeStr.includes('income') || typeStr.includes('deposit') || typeStr.includes('credit')) {
        type = 'income';
      }
    } else {
      // Auto-detect based on amount or description
      if (amount > 0 && (description.toLowerCase().includes('salary') || 
                         description.toLowerCase().includes('deposit') ||
                         description.toLowerCase().includes('refund'))) {
        type = 'income';
      }
    }

    // Auto-categorize
    const categoryId = this.autoCategorizе(description, type);

    return {
      date: date.toISOString(),
      description,
      amount: Math.abs(amount),
      type,
      categoryId
    };
  }

  private static parseDate(dateStr: string): Date | null {
    // Remove common non-date characters
    const cleanedDate = dateStr.replace(/[^\d\/\-\.]/g, '');
    
    // Try different date formats
    const formats = [
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD/MM/YYYY (less common in US)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // MM-DD-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/
    ];

    // Try ISO date first
    const isoDate = new Date(cleanedDate);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try regex patterns
    for (const format of formats) {
      const match = cleanedDate.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Assume first format is YYYY-MM-DD
        if (format === formats[0]) {
          const date = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
          if (!isNaN(date.getTime())) return date;
        }
        
        // For MM/DD/YYYY and MM-DD-YYYY formats
        if (format === formats[1] || format === formats[3]) {
          const date = new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2));
          if (!isNaN(date.getTime())) return date;
        }
      }
    }

    return null;
  }

  private static parseAmount(amountStr: string): number {
    // Remove currency symbols, commas, and parentheses
    let cleaned = amountStr.replace(/[\$,\(\)]/g, '');
    
    // Handle negative amounts (parentheses or minus sign)
    const isNegative = amountStr.includes('(') || amountStr.includes('-');
    
    cleaned = cleaned.replace(/-/g, '');
    
    const amount = parseFloat(cleaned);
    return isNegative ? -Math.abs(amount) : amount;
  }

  private static autoCategorizе(description: string, type: 'income' | 'expense'): string {
    if (type === 'income') {
      return 'cat-5'; // Income category
    }

    const lowerDesc = description.toLowerCase();

    for (const [categoryId, keywords] of Object.entries(this.DEFAULT_CATEGORIES)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return categoryId;
      }
    }

    return 'cat-4'; // Default to Shopping category
  }

  static validateCSVFormat(csvContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!csvContent || csvContent.trim().length === 0) {
      errors.push('CSV file is empty');
      return { isValid: false, errors };
    }

    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      errors.push('CSV file must contain at least a header and one data row');
      return { isValid: false, errors };
    }

    // Check if file looks like CSV
    const firstLine = lines[0];
    if (!firstLine.includes(',') && !firstLine.includes(';') && !firstLine.includes('\t')) {
      errors.push('File does not appear to be in CSV format');
    }

    // Check for required columns
    const headerLower = firstLine.toLowerCase();
    const requiredColumns = ['date', 'description', 'amount'];
    const missingColumns = requiredColumns.filter(col => 
      !headerLower.includes(col) && 
      !headerLower.includes(col.replace('_', '')) &&
      !headerLower.includes(col.replace('description', 'memo'))
    );

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return { 
      isValid: errors.length === 0, 
      errors 
    };
  }

  static generateSampleCSV(): string {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const sampleData = [
      ['date', 'description', 'amount', 'type'],
      [today.toISOString().split('T')[0], 'Starbucks Coffee', '4.85', 'expense'],
      [lastMonth.toISOString().split('T')[0], 'Salary Deposit', '3200.00', 'income'],
      [new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 'Amazon Purchase', '47.99', 'expense'],
      [new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 'Shell Gas Station', '38.42', 'expense'],
      [new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 'Netflix Subscription', '15.99', 'expense']
    ];

    return sampleData.map(row => row.join(',')).join('\n');
  }
}
