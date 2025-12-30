import * as yup from 'yup';

export const validationSchemas = {
  // Auth validations
  login: yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  }),
  
  register: yup.object({
    business_name: yup.string().required('Business name is required'),
    business_type: yup.string().required('Business type is required'),
    industry: yup.string().required('Industry is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().required('Country is required'),
    pincode: yup.string().required('Pincode is required'),
    full_name: yup.string().required('Full name is required'),
    position: yup.string().required('Position is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirm_password: yup.string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    terms: yup.boolean().oneOf([true], 'You must accept the terms'),
  }),
  
  // Product validations
  product: yup.object({
    product_name: yup.string().required('Product name is required'),
    sku: yup.string().required('SKU is required'),
    category: yup.string().required('Category is required'),
    unit_price: yup.number().min(0, 'Price must be positive').required('Price is required'),
    cost_price: yup.number().min(0, 'Cost must be positive').required('Cost is required'),
    current_stock: yup.number().min(0, 'Stock cannot be negative').required('Stock is required'),
    min_stock_level: yup.number().min(0, 'Minimum stock level required'),
    description: yup.string(),
    unit_of_measure: yup.string(),
  }),
  
  // Sale validations
  sale: yup.object({
    customer_name: yup.string().required('Customer name is required'),
    product_id: yup.number().required('Product is required'),
    quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
    unit_price: yup.number().min(0, 'Price must be positive').required('Price is required'),
    total_amount: yup.number().min(0, 'Amount must be positive'),
    tax_rate: yup.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
    discount: yup.number().min(0, 'Discount cannot be negative'),
    payment_status: yup.string().required('Payment status is required'),
    sale_date: yup.date().required('Sale date is required'),
    notes: yup.string(),
  }),
  
  // Production validations
  production: yup.object({
    product_id: yup.number().required('Product is required'),
    planned_quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
    actual_quantity: yup.number().min(0, 'Quantity cannot be negative'),
    production_date: yup.date().required('Production date is required'),
    start_time: yup.string().required('Start time is required'),
    end_time: yup.string().required('End time is required'),
    machine_id: yup.string().required('Machine ID is required'),
    operator_name: yup.string().required('Operator name is required'),
    status: yup.string().required('Status is required'),
    defects: yup.number().min(0, 'Defects cannot be negative'),
    downtime_minutes: yup.number().min(0, 'Downtime cannot be negative'),
    notes: yup.string(),
  }),
  
  // Inventory transaction validations
  inventoryTransaction: yup.object({
    product_id: yup.number().required('Product is required'),
    transaction_type: yup.string().oneOf(['IN', 'OUT', 'ADJUST']).required('Transaction type is required'),
    quantity: yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
    unit_price: yup.number().min(0, 'Price must be positive'),
    notes: yup.string(),
  }),
  
  // Business profile validations
  business: yup.object({
    business_name: yup.string().required('Business name is required'),
    business_type: yup.string().required('Business type is required'),
    industry: yup.string().required('Industry is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone is required'),
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().required('Country is required'),
    pincode: yup.string().required('Pincode is required'),
    currency: yup.string().required('Currency is required'),
    timezone: yup.string().required('Timezone is required'),
    fiscal_year_start: yup.string().required('Fiscal year start is required'),
    gst_number: yup.string(),
    pan_number: yup.string(),
    website: yup.string().url('Invalid URL'),
    description: yup.string(),
  }),
  
  // User profile validations
  userProfile: yup.object({
    full_name: yup.string().required('Full name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
    position: yup.string().required('Position is required'),
  }),
  
  // Change password validations
  changePassword: yup.object({
    current_password: yup.string().required('Current password is required'),
    new_password: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
    confirm_password: yup.string()
      .oneOf([yup.ref('new_password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  }),
};

// Helper function to get validation schema
export const getValidationSchema = (formType) => {
  return validationSchemas[formType] || yup.object();
};

export default validationSchemas;