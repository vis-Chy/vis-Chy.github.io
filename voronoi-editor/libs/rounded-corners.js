//Based on: https://bl.ocks.org/mbostock/76456029b13c68accf6e
//But converted to SVG paths using https://github.com/d3/d3-path
//I don't understand anything that is going on in these functions o_O
//通过改变传入的r值可改变圆角程度，r的取值范围为(r.min,∞]
function drawRoundedPolygon(points, r) {
    var i,
        n = points.length,
        p0,
        p1,
        p2,
        p3,
        n1 = 0,
        t012,
        t123,
        x21, y21,
        x4, y4,
        x5, y5,
        moved,
        circle = polygonInCircle(points);

    // Build a linked list from the array of vertices so we can splice.
    for (i = 0, p1 = points[n - 2], p2 = points[n - 1]; i < n; ++i) {
        p0 = p1, p1 = p2, p2 = points[i];
        p1.previous = p0;
        p1.next = p2;
    }

    // The rounding radius can’t be bigger than the polygon’s incircle.
    // The fudge factor of 1px lets the rounded polygon get squished a bit.
    // TODO Abort the search for the incircle if one is found larger than r.
    r = Math.min(r, circle.radius - 1)
    if (r <= 0) return;

    // TODO do we need to make all these extra passes?
    for (i = 0, p3 = p2.next; n1 <= n; ++n1) {
        p0 = p1, p1 = p2, p2 = p3, p3 = p3.next;
        t012 = cornerTangent(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], r);
        t123 = 1 - cornerTangent(p3[0], p3[1], p2[0], p2[1], p1[0], p1[1], r);

        // If the following corner’s tangent is before this corner’s tangent,
        // replace p1 and p2 with the intersection of the lines 01 and 23.
        if (t012 >= t123) {
            p2 = p0.next = p3.previous = lineLineIntersection(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
            p2.previous = p0;
            p2.next = p3;
            p3 = p2;
            p2 = p3.previous;
            p1 = p2.previous;
            p0 = p1.previous;
            n1 = 0;
            if (--n < 3) break;
        }//if
    }//for i

    // If we removed too many points, just draw the previously computed incircle.
    function draw(context) {
        if (n < 3) {
            context.moveTo(circle[0] + circle.radius, circle[1]);
            context.arc(circle[0], circle[1], circle.radius, 0, 2 * Math.PI);
            return;
        }//if

        // Draw the rounded polygon, compting the corner tangents.
        for (i = 0; i <= n; ++i) {
            p0 = p1, p1 = p2, p2 = p3, p3 = p3.next;
            t012 = cornerTangent(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], r);
            t123 = 1 - cornerTangent(p3[0], p3[1], p2[0], p2[1], p1[0], p1[1], r);
            x21 = p2[0] - p1[0], y21 = p2[1] - p1[1];
            x4 = p1[0] + t012 * x21, y4 = p1[1] + t012 * y21;
            x5 = p1[0] + t123 * x21, y5 = p1[1] + t123 * y21;
            if (moved) context.arcTo(p1[0], p1[1], x4, y4, r);
            else moved = true, context.moveTo(x4, y4);
            context.lineTo(x5, y5);
        }//for i

        return context
    }//function draw

    let p = d3.path()
    return draw(p).toString()
}//function drawRoundedPolygon

// Given a circle of radius r that is tangent to the line segments 01 and 12,
// returns the parameter t of the tangent along the line segment 12.
function cornerTangent(x0, y0, x1, y1, x2, y2, r) {
    var theta = innerAngle(x0, y0, x1, y1, x2, y2),
        x21 = x2 - x1, y21 = y2 - y1,
        l21 = Math.sqrt(x21 * x21 + y21 * y21),
        l14 = r / Math.tan(theta / 2);
    return l14 / l21;
}//function cornerTangent

// A horrible brute-force algorithm for determining the largest circle that can
// fit inside a convex polygon. For each distinct set of three sides of the
// polygon, compute the tangent circle. Then reduce the circle’s radius against
// the remaining sides of the polygon.
function polygonInCircle(points) {
    var circle = { radius: 0 };

    for (var i = 0, n = points.length; i < n; ++i) {
        var pi0 = points[i],
            pi1 = points[(i + 1) % n];
        for (var j = i + 1; j < n; ++j) {
            var pj0 = points[j],
                pj1 = points[(j + 1) % n],
                pij = j === i + 1 ? pj0 : lineLineIntersection(pi0[0], pi0[1], pi1[0], pi1[1], pj0[0], pj0[1], pj1[0], pj1[1]);
            search: for (var k = j + 1; k < n; ++k) {
                var pk0 = points[k],
                    pk1 = points[(k + 1) % n],
                    pik = lineLineIntersection(pi0[0], pi0[1], pi1[0], pi1[1], pk0[0], pk0[1], pk1[0], pk1[1]),
                    pjk = k === j + 1 ? pk0 : lineLineIntersection(pj0[0], pj0[1], pj1[0], pj1[1], pk0[0], pk0[1], pk1[0], pk1[1]),
                    candidate = triangleInCircle(pij[0], pij[1], pik[0], pik[1], pjk[0], pjk[1]),
                    radius = candidate.radius;

                for (var l = 0; l < n; ++l) {
                    var pl0 = points[l],
                        pl1 = points[(l + 1) % n],
                        r = pointLineDistance(candidate[0], candidate[1], pl0[0], pl0[1], pl1[0], pl1[1]);
                    if (r < circle.radius) continue search;
                    if (r < radius) radius = r;
                }

                circle = candidate;
                circle.radius = radius;
            }
        }
    }

    return circle;
}//function polygonInCircle

// Returns the angle between segments 01 and 12.
function innerAngle(x0, y0, x1, y1, x2, y2) {
    var x01 = x0 - x1, y01 = y0 - y1,
        x12 = x1 - x2, y12 = y1 - y2,
        x02 = x0 - x2, y02 = y0 - y2,
        l01_2 = x01 * x01 + y01 * y01,
        l12_2 = x12 * x12 + y12 * y12,
        l02_2 = x02 * x02 + y02 * y02;
    return Math.acos((l12_2 + l01_2 - l02_2) / (2 * Math.sqrt(l12_2 * l01_2)));
}//function innerAngle

// Returns the intersection of the infinite lines 01 and 23.
function lineLineIntersection(x0, y0, x1, y1, x2, y2, x3, y3) {
    var x02 = x0 - x2, y02 = y0 - y2,
        x10 = x1 - x0, y10 = y1 - y0,
        x32 = x3 - x2, y32 = y3 - y2,
        t = (x32 * y02 - y32 * x02) / (y32 * x10 - x32 * y10);
    return [x0 + t * x10, y0 + t * y10];
}//function lineLineIntersection

// Returns the signed distance from point 0 to the infinite line 12.
function pointLineDistance(x0, y0, x1, y1, x2, y2) {
    var x21 = x2 - x1, y21 = y2 - y1;
    return (y21 * x0 - x21 * y0 + x2 * y1 - y2 * x1) / Math.sqrt(y21 * y21 + x21 * x21);
}//function pointLineDistance

// Returns the largest circle inside the triangle 012.
function triangleInCircle(x0, y0, x1, y1, x2, y2) {
    var x01 = x0 - x1, y01 = y0 - y1,
        x02 = x0 - x2, y02 = y0 - y2,
        x12 = x1 - x2, y12 = y1 - y2,
        l01 = Math.sqrt(x01 * x01 + y01 * y01),
        l02 = Math.sqrt(x02 * x02 + y02 * y02),
        l12 = Math.sqrt(x12 * x12 + y12 * y12),
        k0 = l01 / (l01 + l02),
        k1 = l12 / (l12 + l01),
        center = lineLineIntersection(x0, y0, x1 - k0 * x12, y1 - k0 * y12, x1, y1, x2 + k1 * x02, y2 + k1 * y02);
    center.radius = Math.sqrt((l02 + l12 - l01) * (l12 + l01 - l02) * (l01 + l02 - l12) / (l01 + l02 + l12)) / 2;
    return center;
}//function triangleInCircle