const { hausdorffDistance, frechetDistance, evaluateGeometry, rotateTrajectory } = require('../src/utils/geometryMatcher');
const { normalizeTrajectory, extractFeatures } = require('../src/utils/imagePreprocessor');

describe('Geometry Matcher and Trajectory Recognition Tests', () => {
    
    // 生成一个简单的正方形轨迹
    const generateSquare = (size, offsetX = 0, offsetY = 0) => {
        let points = [];
        // Top edge
        for(let x=0; x<=size; x+=size/10) points.push({x: x+offsetX, y: offsetY});
        // Right edge
        for(let y=0; y<=size; y+=size/10) points.push({x: size+offsetX, y: y+offsetY});
        // Bottom edge
        for(let x=size; x>=0; x-=size/10) points.push({x: x+offsetX, y: size+offsetY});
        // Left edge
        for(let y=size; y>=0; y-=size/10) points.push({x: offsetX, y: y+offsetY});
        return points;
    };

    test('1. 平移不变性测试 (Translation Invariance)', () => {
        const sq1 = generateSquare(100, 0, 0);
        const sq2 = generateSquare(100, 500, 500); // 平移500

        const norm1 = normalizeTrajectory(sq1);
        const norm2 = normalizeTrajectory(sq2);

        const hd = hausdorffDistance(norm1, norm2);
        expect(hd).toBeLessThan(0.01); // 归一化后距离应该极小
    });

    test('2. 缩放不变性测试 (Scale Invariance)', () => {
        const sq1 = generateSquare(100);
        const sq2 = generateSquare(500); // 放大5倍

        const norm1 = normalizeTrajectory(sq1);
        const norm2 = normalizeTrajectory(sq2);

        const hd = hausdorffDistance(norm1, norm2);
        expect(hd).toBeLessThan(0.01); 
    });

    test('3. 综合验证通过测试 (重合度≥85%、顺序≥90%、特征≥80%)', () => {
        const basePoints = generateSquare(100);
        // 用户画的稍微有点偏差
        const userPoints = basePoints.map(p => ({
            x: p.x + (Math.random() - 0.5) * 5, // 增加5%的随机噪点
            y: p.y + (Math.random() - 0.5) * 5
        }));

        const baseNorm = normalizeTrajectory(basePoints);
        const userNorm = normalizeTrajectory(userPoints);

        const baseData = {
            normalizedSequence: baseNorm,
            features: extractFeatures(baseNorm)
        };
        const userData = {
            normalizedSequence: userNorm,
            features: extractFeatures(userNorm)
        };

        const result = evaluateGeometry(baseData, userData);
        console.log("Base features:", baseData.features);
        console.log("User features:", userData.features);
        console.log("Test 3 result:", result);
        expect(result.isPassed).toBe(true);
        expect(result.scores.overlap).toBeGreaterThanOrEqual(0.85);
        expect(result.scores.sequence).toBeGreaterThanOrEqual(0.90);
        expect(result.scores.shape).toBeGreaterThanOrEqual(0.80);
    });

    test('4. 验证失败测试 (图形差异过大)', () => {
        const basePoints = generateSquare(100);
        // 用户画了一条直线
        const userPoints = [];
        for(let i=0; i<=100; i+=2) userPoints.push({x: i, y: i});

        const baseNorm = normalizeTrajectory(basePoints);
        const userNorm = normalizeTrajectory(userPoints);

        const baseData = {
            normalizedSequence: baseNorm,
            features: extractFeatures(baseNorm)
        };
        const userData = {
            normalizedSequence: userNorm,
            features: extractFeatures(userNorm)
        };

        const result = evaluateGeometry(baseData, userData);
        expect(result.isPassed).toBe(false); // 不应通过
    });
    
    test('5. 旋转验证稳定性', () => {
        const basePoints = generateSquare(100);
        const baseNorm = normalizeTrajectory(basePoints);
        
        // 旋转90度 (PI/2)
        const rotatedNorm = rotateTrajectory(baseNorm, Math.PI / 2);
        
        const baseData = {
            normalizedSequence: baseNorm,
            features: extractFeatures(baseNorm)
        };
        const userData = {
            normalizedSequence: rotatedNorm,
            features: extractFeatures(rotatedNorm)
        };
        
        // 我们目前的简单Hausdorff和Frechet距离对旋转是敏感的。
        // 为了实现真正的旋转不变性，可以在匹配前通过PCA（主成分分析）对齐，
        // 或者测试多个旋转角度取最小值。此测试用于暴露当前实现的局限或验证容忍度。
        const result = evaluateGeometry(baseData, userData);
        // 如果我们没做旋转对齐，正方形转90度依然是正方形，重合度应该很高！
        expect(result.scores.overlap).toBeGreaterThan(0.80); 
    });
});
