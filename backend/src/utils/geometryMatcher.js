/**
 * 轨迹比对算法模块
 */

// 1. Hausdorff 距离计算
function hausdorffDistance(setA, setB) {
    if (!setA.length || !setB.length) return Infinity;

    function directedHausdorff(A, B) {
        let maxDist = 0;
        for (let a of A) {
            let minDist = Infinity;
            for (let b of B) {
                let dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < minDist) minDist = dist;
            }
            if (minDist > maxDist) maxDist = minDist;
        }
        return maxDist;
    }

    return Math.max(directedHausdorff(setA, setB), directedHausdorff(setB, setA));
}

// 2. 离散 Frechet 距离计算 (评估轨迹顺序一致性)
function frechetDistance(P, Q) {
    if (!P.length || !Q.length) return Infinity;
    
    const n = P.length;
    const m = Q.length;
    const ca = Array.from({ length: n }, () => Array(m).fill(-1));
    
    function c(i, j) {
        if (ca[i][j] > -1) return ca[i][j];
        
        const dist = Math.hypot(P[i].x - Q[j].x, P[i].y - Q[j].y);
        
        if (i === 0 && j === 0) {
            ca[i][j] = dist;
        } else if (i > 0 && j === 0) {
            ca[i][j] = Math.max(c(i - 1, 0), dist);
        } else if (i === 0 && j > 0) {
            ca[i][j] = Math.max(c(0, j - 1), dist);
        } else if (i > 0 && j > 0) {
            ca[i][j] = Math.max(
                Math.min(c(i - 1, j), c(i - 1, j - 1), c(i, j - 1)),
                dist
            );
        }
        return ca[i][j];
    }
    
    return c(n - 1, m - 1);
}

// 3. 形状上下文相似度 (简化版：基于特征点和包围盒比例)
function shapeContextSimilarity(featuresA, featuresB) {
    // 比较平均曲率
    const curveDiff = Math.abs(featuresA.avgCurvature - featuresB.avgCurvature);
    const curveSim = Math.max(0, 1 - curveDiff / Math.max(featuresA.avgCurvature, featuresB.avgCurvature, 0.1));
    
    // 比较面积比
    const areaDiff = Math.abs(featuresA.boundingBoxArea - featuresB.boundingBoxArea);
    const areaSim = Math.max(0, 1 - areaDiff / Math.max(featuresA.boundingBoxArea, featuresB.boundingBoxArea, 1));
    
    // 比较关键特征点数量
    const kpDiff = Math.abs(featuresA.keyPointsCount - featuresB.keyPointsCount);
    const kpSim = Math.max(0, 1 - kpDiff / Math.max(featuresA.keyPointsCount, featuresB.keyPointsCount, 1));

    return (curveSim * 0.3 + areaSim * 0.3 + kpSim * 0.4);
}

/**
 * 综合评估两个轨迹的几何相似度
 * @param {Object} base - 基准轨迹数据 { normalizedSequence, features }
 * @param {Object} user - 用户轨迹数据 { normalizedSequence, features }
 * @returns {Object} 验证结果
 */
function evaluateGeometry(base, user) {
    if (!base || !user || !base.normalizedSequence.length || !user.normalizedSequence.length) {
        return { isPassed: false, reason: "轨迹数据不完整" };
    }

    // 考虑到归一化后，坐标范围在 [-1, 1] 之间，最大距离为 2
    const maxPossibleDist = 2.0;

    // 1. 重合度 (基于 Hausdorff 距离)
    const hd = hausdorffDistance(base.normalizedSequence, user.normalizedSequence);
    // Hausdorff 距离越小，重合度越高
    const overlapScore = Math.max(0, 1 - (hd / (maxPossibleDist * 0.5))); // 适当放大惩罚

    // 2. 轨迹顺序一致性 (基于 Frechet 距离)
    const fd = frechetDistance(base.normalizedSequence, user.normalizedSequence);
    const sequenceScore = Math.max(0, 1 - (fd / (maxPossibleDist * 0.5)));

    // 3. 关键特征点匹配度 (形状上下文)
    const shapeScore = shapeContextSimilarity(base.features, user.features);

    // 设置多维度阈值
    const THRESHOLDS = {
        overlap: 0.85,      // 重合度≥85%
        sequence: 0.90,     // 轨迹顺序一致性≥90%
        shape: 0.80         // 关键特征点匹配数≥80%
    };

    // 这里稍微放宽一些绝对数值，因为实际手绘很难达到完美的数学相似度
    // 为了让游戏可玩，我们对分数进行一定的缩放映射
    const adjustedOverlap = Math.min(1, overlapScore * 1.5);
    const adjustedSequence = Math.min(1, sequenceScore * 1.5);
    const adjustedShape = Math.min(1, shapeScore * 1.2);

    const isPassed = 
        adjustedOverlap >= THRESHOLDS.overlap &&
        adjustedSequence >= THRESHOLDS.sequence &&
        adjustedShape >= THRESHOLDS.shape;

    return {
        isPassed,
        scores: {
            overlap: adjustedOverlap,
            sequence: adjustedSequence,
            shape: adjustedShape
        },
        metrics: {
            hausdorffDist: hd,
            frechetDist: fd
        },
        reason: isPassed ? "几何轨迹验证通过" : 
            `几何验证失败: 重合度(${(adjustedOverlap*100).toFixed(1)}%), 顺序一致性(${(adjustedSequence*100).toFixed(1)}%), 特征匹配(${(adjustedShape*100).toFixed(1)}%)`
    };
}

// 旋转多边形以测试不同角度
function rotateTrajectory(points, angleRad) {
    return points.map(p => ({
        x: p.x * Math.cos(angleRad) - p.y * Math.sin(angleRad),
        y: p.x * Math.sin(angleRad) + p.y * Math.cos(angleRad)
    }));
}

module.exports = {
    hausdorffDistance,
    frechetDistance,
    shapeContextSimilarity,
    evaluateGeometry,
    rotateTrajectory
};
