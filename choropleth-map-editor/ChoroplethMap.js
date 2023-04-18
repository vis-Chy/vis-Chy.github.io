
      //主函数
      function draw(rootData,mappingDomain,valueDomain,svg,geojsonUrl) {
        var n=[],v=[];
        var matchMethod = true;
        rootData.forEach(function(d) {
          d[valueDomain] = parseFloat(d[valueDomain]);
          v.push(d[valueDomain]);
          n.push(d[mappingDomain])
          //判断mappingdomain中的值为字符还是数字(字符)，从而影响匹配方式
          //当全部值都为数字时，认定为按行政区编码匹配
          matchMethod *= !isNaN(d[mappingDomain]);
        });
        
        //计算值域范围。从valueDomain字段中获取min、max,min和max且向上下取整
        dataDomain = [
          Math.floor(d3.min(v)/10)*10,
          Math.ceil(d3.max(v)/10)*10
        ];
        console.log(v);
        console.log(dataDomain);

        if (methodIndex=='number') {
          colorRange = colorSampler(options.fillColorMin,options.fillColorMax,options.sampler)
          var color = d3.scaleQuantile()
                  .domain(dataDomain)
                  .range(colorRange);
          drawNumberMap(svg,geojsonUrl,n,v,color,matchMethod,path)
        } else if (methodIndex=='text') {
          //colorRange
          //drawClassMap()
        }
      }

        //绘制定量数值地图，连续色带表示数据分级
      function drawNumberMap(svg,geojsonUrl,name2match, value2match,color,matchMethod,path) {

        d3.json(geojsonUrl).then(function(geodata) {
          var g={
            code:[],
            name:[]
          };
          geodata.features.forEach(function(d,i){
            g.code[i]=d.properties.code;
            g.name[i]=d.properties.name
          });
          //将data[mappingDomain]，与geodata做匹配，未匹配成功的data要单独存储，并有提示
          if (matchMethod) {
            matchMethod = 'code'
            //按行政编码匹配
            var geodataValid = geodataMatchByCode(g.code,name2match,value2match,geodata)
          }else{
            matchMethod = 'name'
            //按地区名称匹配赋值，
            var geodataValid = geodataMatchByName(g.name,name2match,value2match,geodata)
          }

          //在geodataValid的基础上，剔除全为NaN要素，只保留有值的上级区划(待完成)
          //大概可以直接修正geodataMatchByName()函数

          console.log(geodataValid);
          //未匹配成功清单
          eleNotMatch = [].concat(name2match);
          noMatchList(eleNotMatch)

          //绘制geodataValid
          svg.select("#area").selectAll("path").remove();
          svg.select("#area")
              .selectAll("path")
              .data(geodataValid)
              .enter().append("path")
              .attr("d", path)
              .style("fill", function(e,i) {
                geoElementCentroid.push({name:e.properties.name,value:e.properties.value,coordinates:d3.geoCentroid(e)})//获取并记录每个polygon的中心点
                geoElementArea.push(d3.geoArea(e)*options.scaleFac)//获取并记录每个polygon的面积
                if(isNaN(e.properties.value)){
                  return 'rgba(0,0,0,0)'
                }else if (e.properties.value==''){
                  return 'rgba(0,0,0,0)'
                }else{
                  return color(e.properties.value);
                }
              })
              .style("stroke", options.StrokeColor);
        });
        labelUpdate(options.labelSwitch)
      }

      //字符数据，绘制定名类地图，不连续色彩表示分类(待完成)(算v2版本,此版本可先不考虑)
      function drawClassMap(rootData,mappingDomain,valueDomain,svg,geojsonUrl) {

      }

      function projectionUpdate(scaleValue, projType) {
        switch (projType) {
          case 'Mercator':
            projection = d3.geoMercator()
              .translate([halfWidth, halfHeight])
              .center([103.5,32])
              .scale(scaleValue);
            break;
          case 'Albers China':
            projection = d3.geoConicConformal(25, 47)
              .translate([halfWidth, halfHeight])
              .center([103.5,32])
              .angle(-52)
              .scale(scaleValue);
            break;
        }
        path = d3.geoPath()
            .projection(projection);
      }

      //匹配面板显示表格
      function noMatchList(eleArr) {
        if (eleArr.length) {
          console.log(confirmedInputData);
          var list = []
          confirmedInputData.forEach(e => {
            e[nameKeySelected]
            if (eleArr.includes(e[nameKeySelected])) {
              list.push(e);
            }
          });
          console.log(list);
          //显示未匹配提示面板，显示相关数据
          document.getElementById("alarmDialog").style.display="block"
          var table = d3.select("table");
          var tbody = table.select("tbody");
          var thead = table.select("thead")
          var rowhead = thead.selectAll("th")
              .data(Object.keys(list[0]))
              .enter()
              .append("th")
              .text(function(d) { return d; });
          var rows = tbody.selectAll("tr")
              .data(list)
              .enter()
              .append("tr");
          rows.selectAll("td")
              .data(function(d) { return Object.values(d); })
              .enter()
              .append("td")
              .text(function(d) { return d; });
        }
      }

      //添加地图边界
      function drawBoundary(container,geojsonArr,status,isShrink){
        console.log(geojsonArr);
        console.log(container);
        for (let i = 0; i < geojsonArr.length; i++) {
          var geojsonUrl = geojsonArr[i]
          d3.json(geojsonUrl).then(function(geodata) {
            container.select("#boundary"+i).selectAll("path").remove();
            container.select("#boundary"+i)
              .style("display",function(){
                if (status[i]) {
                  return "block"
                }else{
                  return "none"
                }
              })
              .selectAll("path")
              .data(geodata.features)
              .enter().append("path")
                      .attr("d", path)
                      .style("fill", "none")
                      .style("stroke", options.boundaryColor);
          });
        }
      }

      function drawBoundaryTrigger(svgContainer,status) {
        console.log(status);
        container = svg.select("#boundary");
        for (let i = 0; i < status.length; i++) {
          if (status[i]) {
            console.log(status[i]);
            container.select("#boundary"+i)
                .style("display","block")
          }else{
            container.select("#boundary"+i)
                .style("display","none")
          }
        }
      }

      function labelUpdate(labelType) {
        var container = svg.select('#label')
        container.selectAll('#labeltext').remove()
        switch (labelType) {
          case 'Place name':
            console.log(geoElementCentroid);
            container.append('g').attr("id","labeltext").selectAll("text")
              .data(geoElementCentroid)
              .enter().append("text")
              .attr('x',function(d){
                var coor = projection(d.coordinates)
                return coor[0]
              })
              .attr('y',function(d){
                var coor = projection(d.coordinates)
                return coor[1]
              })
              .attr("font-size", 8)
              .style("text-anchor", "middle")
              .text(function(d){return d.name});
            break;
          case 'Value':
          container.append('g').attr("id","labeltext").selectAll("text")
              .data(geoElementCentroid)
              .enter().append("text")
              .attr('x',function(d){
                var coor = projection(d.coordinates)
                return coor[0]
              })
              .attr('y',function(d){
                var coor = projection(d.coordinates)
                return coor[1]
              })
              .attr("font-size", 8)
              .style("text-anchor", "middle")
              .text(function(d){
                if (!isNaN(d.value)){return d.value}else{return ''}
                });
            break;
        }

      }

      function drawLegend(svg,domain,colorRange){
        //https://cdn.jsdelivr.net/npm/d3-color-legend@1.4.1/dist/
        //上面这个链接不知道怎么用，先记一下
        var sampler = colorRange.length;
        var sValueArr =[];
        //sValueArr对应图例注记标签，注记不标识头和尾，故要比分段数少位
        for (let i = 1; i < sampler; i++) {
          var v = d3.quantile(domain,i/sampler);
          sValueArr[i-1] = formatNumber(v);
        }
        var legendWW = 280;
        var legendW = legendWW/sampler ,
            legendH = 10 ;
        svg.selectAll('#legend').selectAll('g').remove()
        var legend = svg.select('#legend')
            .attr("transform",'translate('+70+','+(height-50)+')');//图例位置
        var legendColor = legend.append("g")
            .attr("id", "legendColor")
            .selectAll('rect')
            .data(colorRange).enter()
            .append("rect")
              .attr("width", legendW + 'px')
              .attr("height", legendH + 'px')
              .attr("x",function(d,i){return legendW*i})
              .attr("fill",function(d,i){return d});
        var legendLine = legend.append("g")
            .attr("id", "legendLine")
            .selectAll('rect')
            .data(sValueArr).enter()
            .append("rect")
              .attr("width", '1px')
              .attr("height", (legendH+8) + 'px')
              .attr("x",function(d,i){return legendW*(i+1)})
              .attr("y",(-8)+'px')
              .attr("fill","#000000");
        var legendText = legend.append("g")
            .attr("id", "legendText")
            .selectAll('text')
            .data(sValueArr).enter()
            .append("text")
              .text(function(d){return d})
              .attr("font-size", 10)
              .attr("width", '1px')
              .style("text-anchor", "middle")
              .attr("x",function(d,i){return legendW*(i+1)})
              .attr("y",(-10)+'px')
              .attr("fill","#000000");
        var legendUnit = legend.append("g")
            .attr("id", "legendUnit")
            .append('text')
            .text(options.dataUnit)
              .attr("font-size", 10)
              .attr("width", '1px')
              .style("text-anchor", "right")
              .attr("x",legendWW +'px')
              .attr("y",(-10)+'px')
              .attr("fill","#000000");
      }



      //svg画板的zoom&pan功能，并不是真正的地图框架漫游功能
      function ZoomDrag(svgContainer) {
        svgContainer.call(d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([0, 20])
            .on("zoom", zoomed));
        function zoomed({transform}) {
          svgContainer.select("#area").attr("transform", transform);
          svgContainer.select("#boundary").attr("transform", transform);
          svgContainer.select("#label").attr("transform", transform);
        }
      }

      function drawTitle(svg,titleText) {
        document.getElementById('title').innerHTML = titleText;       	
      }

      function unitUpdate(svg,txt) {
        d3.select('#legendUnit').select('text')
            .text(txt);
      }      

      //字符串匹配，arr1完全包含arr2中所有字符,且arr2不能只有一个字
      function matchCharacters(arr1, arr2) {
        arr1 = arr1.split('');
        arr2 = arr2.split('');
        if(arr2.length<=1){
          return false;
        }
        for (let i = 0; i < arr2.length; i++) {
          if (!arr1.includes(arr2[i])) {
            return false;
          }
        }
        return true;
      }

      //按文字名称匹配,返回匹配完成的列表。
      //新列表中新增Value字段，含有匹配成功的值，未匹配成功赋值为NaN
      function geodataMatchByName(nameStandardArr,matchedNameArr,matchedValueArr,geodata) {
        var geodataValid=[]
        nameStandardArr.forEach(function(d,i){
          geodata.features[i].properties.value = NaN;//先赋NaN，匹配成功则更新
          for (let ii = 0; ii < matchedNameArr.length; ii++) {
            var isMatch = matchCharacters(d, matchedNameArr[ii])
            if (isMatch) {
              //匹配成功，记录geo元素并合并相应的data值到geodataValid,移除已匹配元素
              geodataValid[i]=geodata.features[i];
              geodataValid[i].properties.value=matchedValueArr[ii];
              matchedNameArr.splice(ii,1)
              matchedValueArr.splice(ii,1)
              break;
            }else{
              //匹配不成功，记录赋值为NaN的该geo元素
              geodataValid[i]=geodata.features[i];
            }
          }
        })
        return geodataValid
      }

      function geodataMatchByCode(codeStandardArr,matchedNameArr,matchedValueArr,geodata){
        var geodataValid=[]
        codeStandardArr.forEach(function(d,i){
          geodata.features[i].properties.value = NaN;//先赋NaN，匹配成功则更新
          for (let ii = 0; ii < matchedNameArr.length; ii++) {
            var isMatch = d==parseInt(matchedNameArr[ii])
            if (isMatch) {
              //匹配成功，记录geo元素并合并相应的data值到geodataValid,移除已匹配元素
              geodataValid[i]=geodata.features[i];
              geodataValid[i].properties.value=matchedValueArr[ii];
              matchedNameArr.splice(ii,1)
              matchedValueArr.splice(ii,1)
              break;
            }else{
              geodataValid[i]=geodata.features[i];
            }
          }
        })
        return geodataValid
      }

      function StrokeUpdate(svgContainer,pWidth, pColor) {
        svg.select("#area")
              .selectAll("path")
              .style("stroke",pColor)
              .style("stroke-width", pWidth+'px')
      }
      
      //根据起始颜色，及分级数，采样分级颜色
      function colorSampler(color1,color2,sampleCount){
        console.log(sampleCount);
        var color = d3.scaleLinear()
   							.domain([1,sampleCount])
   							.range([color1,color2])
                .interpolate(d3.interpolateHcl);
        var colorArr = []
        for (let i = 1; i <= sampleCount; i++) {
          colorArr[i-1] = color(i)
        }
        if (sampleCount == 1) {
          colorArr[0] = color1;
        }
        return colorArr
      }

      function areaFillUpdate(svgContainer,dataDomain,colorRange,noColor) {
        var color = d3.scaleQuantile()
   							.domain(dataDomain)
                .range(colorRange)
        svg.select("#area")
              .selectAll("path")
              .style("fill", function (e,i) {
                if(isNaN(e.properties.value)){
                  return noColor
                }else if (e.properties.value==''){
                  return noColor
                }else{
                  return color(e.properties.value);
                }
              })
      }

      function boundaryUpdate(svgContainer,pWidth, pColor) {
        svg.select("#boundary")
              .selectAll("path")
              .style("stroke",pColor)
              .style("stroke-width", pWidth+'px')
      }

      function getAreaGeojson(unit){
        return areaGeojsonPool[unit]
      }

      function showDomain(loadStatus,domain){
        if (loadStatus) {
          document.getElementById('nameSelector').style.display = "block"
          document.getElementById('valueSelector').style.display = "block"
        }
        var d = Object.keys(domain);
        //拼接option,形成下拉菜单
        var allOptions = "<option value = 'undefined'>——</option>"
        for(var i=0;i<d.length;i++){
          var obj = d[i]
          item = "<option value = '"+obj+"'>"+obj+"</option>";
          allOptions = allOptions + item;
        }
        document.getElementById("nameSelect").innerHTML = allOptions;
        document.getElementById("valueSelect").innerHTML = allOptions;
      }

      function enterFileData(fileData,mapunit,methodIndex){
        //通过统计单元确定调用的分区地图文件
        areaGeojson = getAreaGeojson(mapunit)
        //获取用于地名配对的字段nameKeySelected，和数值字段Value
        var nameEle = document.getElementById("nameSelect");//匹配索引字段
        var valueEle = document.getElementById("valueSelect");//匹配值字段
        var nameIndex = nameEle.selectedIndex
        nameKeySelected = nameEle.options[nameIndex].value;
        var valueIndex = valueEle.selectedIndex
        valueKeySelected = valueEle.options[valueIndex].value;
        //判断，当全部选项都完成后，执行绘制，返回true
        if(mapunit!=undefined && nameKeySelected!= 'undefined' && valueKeySelected!='undefined'){
          // resetStyle()
          switch (methodIndex) {
            case "number":
              if (mapunit) {
                draw(fileData,nameKeySelected,valueKeySelected,svg,areaGeojson)
                drawLegend(svg,dataDomain,colorRange)
              }else{
                //drawNationMap(fileData,nameKeySelected,valueKeySelected,svg,areaGeojson)
                drawLegend(svg,dataDomain,colorRange)
              } 
            break;
            case "text":
              alert("Not support now")
              // drawClassMap(fileData,nameKeySelected,valueKeySelected,svg,areaGeojson)
            break;
          }
          return true;
        }else{
          return false;
        }
      }
    
      function resetStyle(){
          titleControl.setValue('');
          unitControl.setValue('');
      }

      function formatNumber(num) {
        if(Number.isInteger(num)) {
          return num.toFixed(0);
        } else if(num.toFixed(1).split('.')[1] === '0') {
          return num.toFixed(1);
        } else {
          return num.toFixed(2);
        }
      }

      //此函数加载未完全调试安全，且暂时无需使用。如需加载底图就需要进行调试
      function drawOnLeaflet(rootData,mappingDomain,valueDomain,a,geojsonUrl) {
        document.getElementById('map').style.width = width+"px";
        document.getElementById('map').style.height = height+"px";
        console.log(document.getElementById('map').style);
        
        var map = new L.Map("map", {center: [37.8, -96.9], zoom: 4})
              .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

        var svg = d3.select(map.getPanes().overlayPane).append("svg"),
              g = svg.append("g").attr("class", "leaflet-zoom-hide");
              d3.json("geojson/us-states.json").then(function( geodata) {
                  // if (error) throw error;"geojson/us-states.json"
                  var transform = d3.geoTransform({point: projectPoint}),
                  path = d3.geoPath().projection(transform);

                var feature = g.selectAll("path")
                    .data(geodata.features)
                    .enter().append("path");

                map.on("viewreset", reset);
                reset();

                // Reposition the SVG to cover the features.
                function reset() {
                  var bounds = path.bounds(geodata),
                      topLeft = bounds[0],
                      bottomRight = bounds[1];
                  svg .attr("width", bottomRight[0] - topLeft[0])
                      .attr("height", bottomRight[1] - topLeft[1])
                      .style("left", topLeft[0] + "px")
                      .style("top", topLeft[1] + "px");

                  g   .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

                  feature.attr("d", path);
                }

                // Use Leaflet to implement a D3 geometric transformation.
                function projectPoint(x, y) {
                  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
                  this.stream.point(point.x, point.y);
                }
                
              });

      }