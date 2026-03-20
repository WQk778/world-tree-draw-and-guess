const Jimp = require('jimp');

/**
 * 提取图片中的基准轨迹，包含坐标点序列、曲率特征、几何参数
 * @param {string|Buffer} imageSource - 图片URL或Buffer
 * @returns {Promise<Object>} 包含轨迹信息的对象
 */
async function extractBaseTrajectory(imageSource) {
    try {
        const image = await Jimp.read(imageSource);
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        let points = [];
        
        // 遍历像素，提取黑色/深色非透明像素作为轨迹点
        image.scan(0, 0, width, height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            const a = this.bitmap.data[idx + 3];
            
            // 假设目标图形是深色线条，背景是浅色或透明
            const brightness = (r + g + b) / 3;
            if (a > 128 && brightness < 128) {
                points.push({ x, y });
            }
        });
        
        if (points.length === 0) {
            return null; // 没有找到轨迹
        }
        
        // 1. 降采样 (Downsampling)，保留大约100个关键点，以加速后续计算
        points = downsamplePoints(points, 100);
        
        // 2. 轨迹排序 (使用贪心算法近似TSP，重构绘制顺序)
        const orderedSequence = reconstructSequence(points);
        
        // 3. 标准化 (平移到原点，缩放到单位圆/单位框内)，实现平移和缩放不变性
        const normalizedSeq = normalizeTrajectory(orderedSequence);
        
        // 4. 提取曲率特征和关键几何参数
        const features = extractFeatures(normalizedSeq);
        
        return {
            originalPoints: orderedSequence,
            normalizedSequence: normalizedSeq,
            features: features
        };
    } catch (error) {
        console.error('Error extracting base trajectory:', error);
        throw error;
    }
}

// 空间降采样
function downsamplePoints(points, targetCount) {
    if (points.length <= targetCount) return points;
    const step = Math.ceil(points.length / targetCount);
    return points.filter((_, i) => i % step === 0);
}

// 贪心算法重构轨迹顺序
function reconstructSequence(points) {
    if (points.length === 0) return [];
    
    let unvisited = [...points];
    let sequence = [unvisited.shift()]; // 从第一个点开始
    
    while (unvisited.length > 0) {
        let last = sequence[sequence.length - 1];
        let minDist = Infinity;
        let minIdx = -1;
        
        for (let i = 0; i < unvisited.length; i++) {
            let dist = Math.hypot(last.x - unvisited[i].x, last.y - unvisited[i].y);
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        
        sequence.push(unvisited[minIdx]);
        unvisited.splice(minIdx, 1);
    }
    
    return sequence;
}

// 归一化：中心对齐，最大半径缩放为1
function normalizeTrajectory(points) {
    if (points.length === 0) return [];
    
    // 计算质心
    let sumX = 0, sumY = 0;
    for (let p of points) {
        sumX += p.x;
        sumY += p.y;
    }
    const cx = sumX / points.length;
    const cy = sumY / points.length;
    
    // 平移
    let centered = points.map(p => ({ x: p.x - cx, y: p.y - cy }));
    
    // 缩放
    let maxDist = 0;
    for (let p of centered) {
        let d = Math.hypot(p.x, p.y);
        if (d > maxDist) maxDist = d;
    }
    
    if (maxDist === 0) maxDist = 1;
    
    return centered.map(p => ({ x: p.x / maxDist, y: p.y / maxDist }));
}

// 提取曲率特征和关键几何参数
function extractFeatures(points) {
    let curvatures = [];
    let turningPoints = 0; // 关键转折点数量
    let totalLength = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
        let p1 = points[i - 1];
        let p2 = points[i];
        let p3 = points[i + 1];
        
        let v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        let v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        let cross = v1.x * v2.y - v1.y * v2.x;
        let dot = v1.x * v2.x + v1.y * v2.y;
        
        let angle = Math.atan2(cross, dot);
        curvatures.push(angle);
        
        // 角度变化大于60度(PI/3)且线段有一定长度才视为特征点，过滤噪点
        if (Math.abs(angle) > Math.PI / 3 && Math.hypot(v1.x, v1.y) > 0.05 && Math.hypot(v2.x, v2.y) > 0.05) { 
            turningPoints++;
        }
        
        totalLength += Math.hypot(v1.x, v1.y);
    }
    if (points.length >= 2) {
        let lastV = { x: points[points.length-1].x - points[points.length-2].x, y: points[points.length-1].y - points[points.length-2].y };
        totalLength += Math.hypot(lastV.x, lastV.y);
    }
    
    return {
        avgCurvature: curvatures.reduce((a, b) => a + Math.abs(b), 0) / (curvatures.length || 1),
        keyPointsCount: turningPoints,
        pathLength: totalLength,
        boundingBoxArea: getBoundingBoxArea(points)
    };
}

function getBoundingBoxArea(points) {
    if (points.length === 0) return 0;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return (maxX - minX) * (maxY - minY);
}

module.exports = {
    extractBaseTrajectory,
    normalizeTrajectory,
    extractFeatures
};
