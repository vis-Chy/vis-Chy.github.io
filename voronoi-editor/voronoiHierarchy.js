      //剪裁形状绘制
      function make_regular_polygon(width, height, border, sides) {
        var center = [width*0.5, height*0.5],
          width_radius = (width - 2*border) * 0.5,
          height_radius = (height - 2*border) * 0.5,
          radius = Math.min( width_radius, height_radius ),
          angle_radians = 2*Math.PI / sides,
          initial_angle = sides%2==0 ? -Math.PI/2 -angle_radians*0.5 : -Math.PI/2, // subtract angles
          result = [],
          somevariable = 0;
        
        // special case few sides
        if (sides == 3) {
          center[1] += height_radius / 3.0; // can always do this (I think?)
        
          radius_for_width = width_radius * 2 / Math.sqrt(3);
          radius_for_height = height_radius * 4.0 / 3.0;
          radius = Math.min(radius_for_width, radius_for_height);
        }
        else if (sides == 4) {
          radius *= Math.sqrt(2);
        }
        
        for (var i = 0; i < sides; i++) {
          result.push([center[0] + radius * Math.cos(initial_angle - i * angle_radians), center[1] + radius * Math.sin(initial_angle - i * angle_radians)]);
        }
        return result;
      }

      ///////// bounding polygon
      function get_selected_polygon(size) {
        var width_less_border = width - size;
        var height_less_border = height - size;
        var entire_svg_polygon = [[size,size],
          [size,height_less_border],
          [width_less_border,height_less_border],
          [width_less_border,size]];

        var select_polygon = options.shape;
        if (select_polygon == "rectangle") {
          return entire_svg_polygon;
        }
        else if (select_polygon == "triangle") {
          return make_regular_polygon(width, height, size, 3);
        }
        else if (select_polygon == "pentagon") {
          return make_regular_polygon(width, height, size, 5);
        }
        else if (select_polygon == "octagon") {
          return make_regular_polygon(width, height, size, 8);
        }
        else if (select_polygon == "circle") {
          return make_regular_polygon(width, height, size, 100);
        }	
      }


      function initData() {
        clipingPolygon = get_selected_polygon(sizeScale(options.size));
        clipingOutline = get_selected_polygon(sizeScale(options.size)-options.cellsInterval);
      }

      function initLayout(hierarchy) {
        svg = d3.select("svg")
          .attr("width", svgWidth)
          .attr("height", svgHeight);

        svg.selectAll(".drawingArea").remove();

        drawingArea = svg.append("g")
        	.classed("drawingArea", true)
        	.attr("transform", "translate("+[margin.left,margin.top]+")");
        
        treemapContainer = drawingArea.append("g")
        	.classed("treemap-container", true)
        	.attr("transform", "translate("+treemapCenter+")");
        
        treemapContainer.append("path")
        	.classed("world", true)
        	.attr("transform", "translate("+[-width*0.5,-height*0.5]+")")
        	.attr("d", "M"+clipingOutline.join(",")+"Z")//绘制外接形状
          .style("fill",options.intercellularColor)
        
        drawTitle(options.titleName);

        setupColorScale(hierarchy);
        function setupColorScale(hierarchy) {
        //Get the distinct colors
        let colors_needed = color_scale.colors(hierarchy.children.length)
        color_array = []
        for(let i = 0; i < hierarchy.children.length; i++) {
            color_array.push({
                color: colors_needed[i],
                name: hierarchy.children[i].data.name
            })
          }
        }

        setupFontScale(hierarchy);
        function setupFontScale(hierarchy) {
          // console.log(hierarchy);
          var v=[];
          var mi = hierarchy.children[0].children[0].data.weight,
              ma = hierarchy.children[0].children[0].data.weight;
          hierarchy.leaves().forEach(function (d,i) {
                v[i] = d.value
                })
          fontScale.domain([Math.min.apply(null,v), Math.max.apply(null,v)]).range([9, 16]).clamp(true); //设置字体大小渐变范围
        }

        drawLegends(hierarchy);
      }
      
      function drawTitle(titleText) {
        drawingArea.append("text")
        	.attr("id", "title")
        	.attr("transform", "translate("+[halfWidth, titleY+20]+")")
        	.attr("text-anchor", "middle")
          .text(titleText)
      }
      
      function drawLegends(hierarchy) {

        var legendHeight = 13,
            interLegend = 4,
            colorWidth = legendHeight*2,
            classes = hierarchy.children.reverse();
        
        var legendContainer = drawingArea.append("g")
        	.classed("legend", true)
        	.attr("transform", "translate("+[0, legendsMinY]+")");
        
        var legends = legendContainer.selectAll(".legend")
        	.data(classes)
        	.enter();
        
        var legend = legends.append("g")
        	.classed("legend", true)
        	.attr("transform", function(d,i){
            return "translate("+[10, -i*(legendHeight + interLegend)]+")";
          })
        	
        legend.append("rect")
        	.classed("legend-color", true)
        	.attr("y", -legendHeight)
        	.attr("width", colorWidth)
        	.attr("height", legendHeight)
        	.style("fill", function(d){
            var c;
            color_array.forEach(a => {
              if (a.name === d.data.name){c = a.color}})
            return c;
            // return d.color
          });
        legend.append("text")
        	.classed("tiny", true)
        	.attr("transform", "translate("+[colorWidth+5, -2]+")")
        	.text(function(d){ return d.data.name; });

      }
      
      function drawTreemap(hierarchy) {
        var leaves=hierarchy.leaves();
        var cells = treemapContainer.append("g")
        	.classed('cells', true)
        	.attr("transform", "translate("+[-width*0.5,-height*0.5]+")")
	        .selectAll(".cell")
        	.data(leaves)
        	.enter()
        		.append("g")
            .classed("cell", true)

        cells.append("path")
          .classed("cellpath", true)
          // .attr("d", function(d){ return "M"+d.polygon.join(",")+"z"; })
          .attr("d", (d,i) => {
                d.data.area = d3.polygonArea(d.polygon)
                return drawRoundedPolygon(d.polygon, area_scale(d.data.area)+options.roundFac*area_scale(d.data.area)) //rounded-corners.js
            })
          .style("fill", function(d){
            var n;
            if (d.depth >= 2){
              n = d.parent.data.name
            }
            else{
              n = d.data.name
            }
            var c;
            color_array.forEach(a => {
              if (a.name === n){c = a.color}})
            return c;
            // return d.parent.data.color;
          })
          .style("stroke-width", options.cellsInterval + "px")
          .style("stroke", options.intercellularColor);
          
        
        var labels = treemapContainer.append("g")
        	.classed('labels', true)
        	.attr("transform", "translate("+[-width*0.5,-height*0.5]+")")
	        .selectAll(".label")
        	.data(leaves)
        	.enter()
        		.append("g")
        			.classed("label", true)
        			.attr("transform", function(d){
          			return "translate("+[d.polygon.site.x, d.polygon.site.y]+")";
              })
              .style("opacity", function(d){ return (d.data.weight/hierarchy.value < options.lablesAmount) ? 0 : 1; })
        			.style("font-size", function(d){ return fontScale(d.data.weight); });
        
        labels.append("text")
        	.classed("name", true)
        	.html(function(d){
          	return d.data.name;
        	});
        labels.append("text")
        	.classed("value", true)
        	.text(function(d){ return d.data.weight+options.valueUnit; });
        
        //字号控制，自适应字号或固定字号
        if (options.autoFontSize)
        {
          //按值的大小分配字号，文字和值的字号一同变动
        }
        else{
          //可自由修改文字和值字号大小
          labels.selectAll(".name")
            .style("font-size",options.namefontsize+"px");
          labels.selectAll(".value")
            .style("font-size",options.valuefontsize+"px");
        }

        var hoverers = treemapContainer.append("g")
        	.classed('hoverers', true)
        	.attr("transform", "translate("+[-width*0.5,-height*0.5]+")")
	        .selectAll(".hoverer")
        	.data(leaves)
        	.enter()
        		.append("path")
        			.classed("hoverer", true)
        			.attr("d", function(d){ return "M"+d.polygon.join(",")+"z"; })
              .on("mouseover", mouseOver)
              .on("mouseout", mouseOut);
        
        function mouseOver(d){
          var s = d.path[0].__data__.data.name
          let dur = 300

          //Raise to the top, so it overlaps all
          d3.select(this).raise()

          //Fade all the other cells
          d3.selectAll(".cell")
            .transition("fade").duration(dur)
            .style("opacity", function(a){
              return a.data.name !== s ? 0.5 : 1;
            })
          
          //Reveal the text (if it was hidden)
          d3.selectAll(".label")
            .transition("fade").duration(dur)
            .style("opacity", function(a){
              return a.data.name !== s ? 0 : 1;
            })
        }

        function mouseOut(d){
          var s = d.path[0].__data__.data.name
          let dur = 300

          //Reveal all the other cells again
          d3.selectAll(".cell")
            .transition("fade").duration(dur)
            .style("opacity", 1)
          
          //Reveal the text (if it was hidden)
          d3.selectAll(".label")
            .transition("fade").duration(dur)
            .style("opacity", function(a){
              return (a.data.weight/hierarchy.value < options.lablesAmount) ? 0 : 1;
            })
        }

      }