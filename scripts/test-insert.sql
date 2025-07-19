-- Test insert to verify everything works
INSERT INTO pc_survey_data (
    role,
    other_role,
    seniority,
    company_type,
    company_size,
    industry,
    product_type,
    customer_segment,
    main_challenge,
    daily_tools,
    learning_methods,
    content_preferences,
    email
) VALUES (
    'Product Manager',
    NULL,
    'Senior (5-8 years)',
    'Scale-up (Series D+)',
    'Scale-up (Series D+)',
    'Technology/Software',
    'SaaS (B2B)',
    'B2B Product',
    'Balancing user needs with business requirements',
    ARRAY['Jira', 'Figma', 'Notion'],
    ARRAY['Books', 'Community'],
    ARRAY['content'],
    'test@example.com'
);

-- Verify the insert worked
SELECT * FROM pc_survey_data ORDER BY created_at DESC LIMIT 1;
