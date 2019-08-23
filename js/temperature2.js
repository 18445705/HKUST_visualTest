var margin = { top: 50, right: 0, bottom: 100, left: 75 },
    width = 1100 - margin.left - margin.right,
    height = 730 - margin.top - margin.bottom,
    datasets = ["temperature_daily.csv"],
    beginYear=2008,
    lastYear=2017,
    legendElementWidth = 20,
    buckets = 8,
    colors = ["#393b79","#4169E1","#00BFFF","#87CEFA","#FFDAB9","#FFD700","#FF4500","#8B0000"], // alternatively colorbrewer.YlGnBu[9]
    legendlabels = ["Celsius"];

var heatmapChart = function(csvFile) {

    var yearNum=lastYear-beginYear;
        gridSize = Math.round(width / (yearNum+2)),
        ygridSize=Math.round(width / 18),

    operation = ["minimum", "maximum"];

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("display", "block")
        .attr("margin", "auto")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("/data/"+csvFile,
        function(d) {
            var date = new Date(d.date);
            var year=date.getFullYear();
            var month=date.getMonth();
            var day=date.getDate();
            return {
                year: +year,
                month: +month,
                day: +day,
                min: +d.min_temperature,
                max: + d.max_temperature,
                date : d3.timeParse("%Y-%m-%d")(d.date),
            };
        },

        function(error, data) {
            // console.log(data);
            // console.log(data[0]);
            var x = d3.scaleTime()
                .domain([new Date(2012, 0, 1), new Date(2012, 11, 31)])
                .rangeRound([ 0, ygridSize * 12]).nice();
            svg.append("g")
                .attr("transform", "translate(-10,0)")
                .call(d3.axisLeft(x).tickFormat(d3.timeFormat('%b')).ticks(d3.timeMonth.every(1)));

            var y = d3.scaleTime()
                .domain(d3.extent(data, function(d) {if(d.year>(beginYear-1)){return d.date;} }))
                .range([ 0, gridSize * (yearNum+1)])
                .nice();
            svg.append("g")
                .attr("transform", "translate(0,-10)")
                .call(d3.axisTop(y).tickFormat(d3.timeFormat('%Y')).ticks(d3.timeYear.every(1)));

            var datas={};//save the min temperature of each month
            var maxdatas={};//save the max temperature of each month
            var mintem=data[0].min;
            var maxtem=data[0].max;
            for (var i = 0; i < data.length; i++) {
                if(i==0||data[i].year==data[i-1].year){
                    if(i==0||data[i].month==data[i-1].month){
                        // console.log(data[i].min);
                        var names=data[i].year+'/'+data[i].month;
                        data[i].min<mintem?mintem=data[i].min:mintem;
                        data[i].max>maxtem?maxtem=data[i].max:maxtem;
                        datas[names]=mintem;
                        maxdatas[names]=maxtem;
                        // console.log(names);
                    }else{
                        mintem=data[i].min;
                        maxtem=data[i].max;
                    }
                }else{
                    mintem=data[i].min;
                    maxtem=data[i].max;
                }
            }

            // console.log(typeof datas);
            // console.log(datas);
            // console.log(maxdatas);
            // var mindata=[];//save the min temperature of each month
            var wholedata=[];//save the max and min temperature of each month
            for (var item in datas){
                // console.log(item);
                var itemsplit = item.split("/");
                if(itemsplit[0]>(beginYear-1)){
                    for(var maxitem in maxdatas){
                        if(item==maxitem){
                            wholedata.push({"year":itemsplit[0],"month":itemsplit[1],"min":datas[item],"max":maxdatas[maxitem]});
                        }
                    }
                    // console.log(mindata);
                    // break;
                }

            }
            // console.log(wholedata);
            const colorScale = d3.scaleQuantile()
                .domain([0, buckets - 1, d3.max(data, function (d) { return d.max; })])
                .range(colors);
            // console.log(colorScale.quantiles());

            // Setup the tool tip.
            var tool_tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-8, 0])
                .html(function(d) { return "Date: "+d.year+"-"+(parseInt(d.month)+1)+"; max: " + d.max+" min: " + d.min; });
            svg.call(tool_tip);

            var changtem=function(operation="minimum"){

                const cards = svg.append("g").attr('class','temColor').selectAll(".day")
                    .data(wholedata, function(d) {return d.month+':'+d.year;})
                    .enter();
                // console.log(d3.max(data.month[0], function (d) { return d.max; }));

                cards.append("rect")
                    .attr("x", function(d) { return (d.year - beginYear) * gridSize; })
                    .attr("y", function(d) { return (d.month) * ygridSize; })
                    .attr("rx", 4)
                    .attr("ry", 4)
                    .attr("class", "year bordered")
                    .attr("width", gridSize)
                    .attr("height", ygridSize)
                    .style("fill", colors[0])
                    .on('mouseover', tool_tip.show)
                    .on('mouseout', tool_tip.hide)
                    .merge(cards)
                    .transition()
                    .duration(1000);
                const cardsitem = svg.selectAll(".year");

                if(operation=="minimum"){
                    cardsitem.style("fill", function(d) { return colorScale(d.min)});
                }else{
                    if(operation=="maximum"){
                        cardsitem.style("fill", function(d) { return colorScale(d.max)});
                    }
                }

                cards.exit().remove();

                //line chart area
                // console.log(d3.map(data,d=>d.date.toString().substring(0,4)).entries());
                var minlinedata=[];//data format YYYY/MM/ min
                var maxlinedata=[];
                var keyindex;
                var name;
                for (i=0; i<data.length; i++){
                    if(data[i].year>(beginYear-1)){
                        if(i==data.length-1){
                            var next=data[i];
                        }else{
                            var next=data[i+1];
                        }
                        if(data[i].year==next.year && next.month==next.month){
                            keyindex=data[i].year+'/'+data[i].month;
                            minlinedata.push({"keyindex":keyindex,"min":data[i].min})
                            maxlinedata.push({"keyindex":keyindex,"max":data[i].max})
                        }
                    }
                }

                // console.log(minlinedata);

                // var monthmin={};//YYYY/M [min min ...]
                monthmin = minlinedata.reduce(function (pre,cur) {
                    pre[cur.keyindex] = pre[cur.keyindex] || [];
                    pre[cur.keyindex].push(cur);
                    return pre;
                }, Object.create(null));
                // console.log(monthmin);

                monthmax = maxlinedata.reduce(function (pre,cur) {
                    pre[cur.keyindex] = pre[cur.keyindex] || [];
                    pre[cur.keyindex].push(cur);
                    return pre;
                }, Object.create(null));
                // console.log(monthax);

                // console.log(d3.map(minlinedata,d=>d.keyindex).entries());
                var lineX = d3.scaleBand()
                    .domain(d3.range(0,32))
                    .rangeRound([1, gridSize]);
                var lineY = d3.scaleBand()
                    .domain(d3.range(1, 40))
                    .rangeRound([ ygridSize, 0]);
                // console.log(monthmin)
                for (var item in monthmin){
                    svg.datum(monthmin[item])
                    // .enter()
                        .append("path")
                        .attr('width',gridSize)
                        .attr('height',ygridSize)
                        .attr("fill", "none")
                        .attr("stroke", "#E0FFFF")
                        .attr("stroke-width", 1.5)
                        .attr("transform", "translate(" + (item.substring(0,4) - beginYear) * gridSize +","+item.substring(5) * ygridSize +")")
                        .transition()
                        .attr("d", d3.line()
                            .x(function(d,i) { return lineX(i) })
                            .y(function(d) { return lineY(d.min) })
                        );
                    // console.log(monthmin[item]);
                    // break;
                }

                for (var item in monthmax){
                    svg.datum(monthmax[item])
                        .append("path")
                        .attr('width',gridSize)
                        .attr('height',ygridSize)
                        .attr("fill", "none")
                        .attr("stroke", "#808080")
                        .attr("stroke-width", 1.5)
                        .attr("transform", "translate(" + (item.substring(0,4) - beginYear) * gridSize +","+item.substring(5) * ygridSize +")")
                        .transition()
                        .attr("d", d3.line()
                            .x(function(d,i) { return lineX(i) })
                            .y(function(d) { return lineY(d.max) })
                        );
                    // console.log(monthmax[item]);
                    // break;
                }

            };
            changtem();

            var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
                .data(operation);

            datasetpicker.enter()
                .append("input")
                .attr("value", function(d){ return "Show "+d+" temperature by month"; })
                .attr("type", "button")
                .attr("class", "marginrl operation-button")
                .on("click", function(d) {
                    changtem(d);
                });

            var legendlabel = svg.selectAll(".legendlabel")
                .data(legendlabels)
                .enter().append("g").attr("class",'legendLabel').append("text")
                .text(function (d) { return d; })
                .attr("class", "mono")
                .attr("x", width-legendElementWidth-45)
                .attr("y", 15);

            var legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), function(d) { return d; })
                .enter().append("g")
                .attr("class", "legend");

            legend.append("rect")
                .attr("x", width-legendElementWidth-45)
                .attr("y", function(d, i) { return ygridSize/2 * i+25; })
                .attr("width", legendElementWidth)
                .attr("height", ygridSize / 2)
                .style("fill", function(d, i) { return colors[i]; });

            legend.append("text")
                .attr("class", "mono")
                .text(function(d) { return "≥ " + Math.round(d); })
                .attr("x", width-legendElementWidth-15)
                .attr("y", function(d, i) { return ygridSize/2 * i+40; });

            legend.exit().remove();

        });
};


heatmapChart(datasets[0]);

yearsBtn=[5,6,7,8,9,10];

var yearBtnPicker = d3.select("#lastYears")
    .attr('margin-top','10px')
    .selectAll(".year-button")
    .data(yearsBtn);
yearBtnPicker.enter()
    .append("input")
    .attr("value", function(d){ return "Show Last "+d+" Years"; })
    .attr("type", "button")
    .attr('margin','5px')
    .attr("class", "marginrl operation-button")
    .on("click", function(d) {
        beginYear=(lastYear-d)+1;
        d3.select("#chart svg").remove();
        d3.selectAll("#dataset-picker > *").remove();
        heatmapChart(datasets[0]);
    });


