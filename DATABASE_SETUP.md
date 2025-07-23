# 🗄️ Database Setup Instructions

## 📋 **Required Tables by Environment**

### **MAIN Environment (`pc_survey_data`)**
- Used for production/main branch
- Existing table structure

### **DEV Environment (`pc_survey_data_dev`)**
- Used for development/dev branch  
- Needs to be created with new salary fields

## 🛠️ **SQL Commands for Supabase**

### **1. Create Dev Table with New Salary Fields**

```sql
-- Create pc_survey_data_dev table with salary fields
CREATE TABLE pc_survey_data_dev (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT,
    other_role TEXT,
    seniority TEXT,
    company_type TEXT,
    company_size TEXT,
    industry TEXT,
    product_type TEXT,
    customer_segment TEXT,
    main_challenge TEXT,
    daily_tools TEXT[], -- Array of strings
    other_tool TEXT,
    learning_methods TEXT[], -- Array of strings
    salary_currency TEXT DEFAULT 'ARS', -- NEW FIELD
    salary_min TEXT, -- NEW FIELD (stored as string for flexibility)
    salary_max TEXT, -- NEW FIELD
    salary_average TEXT, -- NEW FIELD
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Add Salary Fields to Existing Main Table (Optional)**

```sql
-- Add new salary fields to existing pc_survey_data table
ALTER TABLE pc_survey_data 
ADD COLUMN salary_currency TEXT DEFAULT 'ARS',
ADD COLUMN salary_min TEXT,
ADD COLUMN salary_max TEXT,
ADD COLUMN salary_average TEXT;
```

### **3. Create Indexes for Performance**

```sql
-- Indexes for dev table
CREATE INDEX idx_pc_survey_data_dev_created_at ON pc_survey_data_dev(created_at);
CREATE INDEX idx_pc_survey_data_dev_role ON pc_survey_data_dev(role);
CREATE INDEX idx_pc_survey_data_dev_industry ON pc_survey_data_dev(industry);
CREATE INDEX idx_pc_survey_data_dev_salary_currency ON pc_survey_data_dev(salary_currency);

-- Indexes for main table (if adding salary fields)
CREATE INDEX idx_pc_survey_data_salary_currency ON pc_survey_data(salary_currency);
```

### **4. Enable Row Level Security (RLS)**

```sql
-- Enable RLS for dev table
ALTER TABLE pc_survey_data_dev ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (similar to main table)
CREATE POLICY "Enable read access for all users" ON pc_survey_data_dev
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON pc_survey_data_dev
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON pc_survey_data_dev
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON pc_survey_data_dev
    FOR DELETE USING (true);
```

## 🎯 **Manual Setup Steps**

### **For Development (dev branch):**

1. **Access Supabase Console**
   - Go to https://supabase.com/dashboard
   - Select your project: `qaauhwulohxeeacexrav`

2. **Run SQL Commands**
   - Go to SQL Editor
   - Copy and paste the "Create Dev Table" SQL above
   - Execute the command

3. **Verify Table Creation**
   - Check that `pc_survey_data_dev` table exists
   - Verify all columns including salary fields

4. **Test Connection**
   - Go to your dev app
   - Navigate to Database tab
   - Should show "DEV - Table: pc_survey_data_dev"
   - Connection status should be "Connected"

### **For Production (main branch):**

1. **Option A: Add Salary Fields to Existing Table**
   - Run the "Add Salary Fields" SQL
   - Existing data will have NULL salary values

2. **Option B: Keep Separate**
   - Keep main table as-is
   - Only dev gets salary functionality

## 🔄 **Environment Detection**

The app automatically detects environment based on:

- **URL hostname**: Contains 'dev', 'localhost', or '127.0.0.1' → DEV
- **Environment variables**: `BRANCH=dev` or `NODE_ENV=development` → DEV  
- **Default**: MAIN environment

## 📊 **Expected Data Differences**

### **DEV Environment Features:**
- ✅ Salary range analysis
- ✅ Currency selection (ARS/USD)
- ✅ Salary analytics charts
- ✅ All v2.0.0 features

### **MAIN Environment:**
- ✅ All existing functionality  
- ⚠️ No salary fields (unless manually added)
- ✅ Stable production data

## 🚨 **Important Notes**

1. **Data Separation**: Dev and main use completely separate tables
2. **No Data Mixing**: Changes in dev won't affect main data
3. **Manual Creation**: Dev table needs to be created manually in Supabase
4. **Schema Evolution**: New fields can be tested in dev first

## ✅ **Verification Checklist**

After setup, verify:

- [ ] `pc_survey_data_dev` table exists in Supabase
- [ ] All salary fields are present (salary_currency, salary_min, salary_max, salary_average)
- [ ] RLS policies are enabled
- [ ] App shows correct environment in Database tab
- [ ] Survey shows salary question (step 9)
- [ ] Analytics display salary charts

---

**Need help with setup? Let me know which step needs manual intervention!** 🛠️