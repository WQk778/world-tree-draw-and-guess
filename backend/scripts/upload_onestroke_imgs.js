require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function uploadImages() {
    const imgDir = path.join(__dirname, '../../admin/img');
    const files = fs.readdirSync(imgDir);

    // Clear existing questions first to avoid duplicates
    console.log('Clearing old questions...');
    await supabase.from('onestroke_questions').delete().neq('id', 0);

    for (const file of files) {
        if (!file.endsWith('.jpg') && !file.endsWith('.png')) continue;
        
        const filePath = path.join(imgDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        
        console.log(`Uploading ${file}...`);
        
        const { data, error } = await supabase.storage
            .from('onestroke')
            .upload(file, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
        if (error) {
            console.error(`Failed to upload ${file}:`, error.message);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('onestroke')
            .getPublicUrl(file);
            
        console.log(`Uploaded ${file} -> ${publicUrl}`);
        
        // Insert into database
        const answerName = file.split('.')[0]; // e.g., '1' for '1.jpg' - you might want to map this to real words
        
        // Map numbers to words for the demo
        const answerMap = {
            '1': '圆柱体',
            '2': '汉字中',
            '3': '偏心嵌套圆',
            '4': '三个对顶三角形',
            '5': '奥迪车标',
            '6': '六芒星'
        };
        
        const realAnswer = answerMap[answerName] || `图形${answerName}`;

        await supabase.from('onestroke_questions').insert({
            image_url: publicUrl,
            answer_name: realAnswer
        });
    }
    console.log('Done!');
}

uploadImages();