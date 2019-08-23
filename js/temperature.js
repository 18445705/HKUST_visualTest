var margin = { top: 50, right: 0, bottom: 100, left: 75 },
    width = 1020 - margin.left - margin.right,
    height = 690 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 21),
    legendElementWidth = gridSize*2,
    buckets = 8,
    colors = ["#393b79","#4169E1","#00BFFF","#87CEFA","#FFDAB9","#FFD700","#FF4500","#8B0000"], // alternatively colorbrewer.YlGnBu[9]
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    years = ["1997", "1998", "1999", "2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017"];
datasets = ["temperature_daily.csv"];
operation = ["minimum", "maximum"];
legendlabels = ["Celsius"];


var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("display", "block")
    .attr("margin", "auto")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var monthLabels = svg.selectAll(".monthLabel")
    .data(months)
    .enter().append("text")
    .text(function (d) { return d; })
    .attr("x", 0)
    .attr("y", function (d, i) { return i * gridSize-4; })
    .style("text-anchor", "end")
    .attr("transform", "translate(-4," + gridSize / 1.5 + ")")
    .attr("class", "dayLabel mono axis");

var yearLabels = svg.selectAll(".yearLabel")
    .data(years)
    .enter().append("text")
    .text(function(d) { return d; })
    .attr("x", function(d, i) { return i * gridSize; })
    .attr("y", 0)
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + gridSize / 2 + ", -6)")
    .attr("class", "timeLabel mono axis");

var heatmapChart = function(csvFile) {
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
                // date : d3.timeParse("%Y-%m-%d")(d.date),
            };
        },
        function(error, data) {

            var datas={};
            var maxdatas={};
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
            // var mindata=[];
            var wholedata=[];
            for (var item in datas){
                var itemsplit = item.split("/");
                for(var maxitem in maxdatas){
                    if(item==maxitem){
                        wholedata.push({"year":itemsplit[0],"month":itemsplit[1],"min":datas[item],"max":maxdatas[maxitem]});
                    }
                }
                // mindata.push({"year":itemsplit[0],"month":itemsplit[1],"min":datas[item]});
                // console.log(mindata);
                // break;
            }
            // console.log(wholedata);
            const colorScale = d3.scaleQuantile()
                .domain([0, buckets - 1, d3.max(data, function (d) { return d.max; })])
                .range(colors);

            // Setup the tool tip.
            var tool_tip = d3.tip()
                .attr("class", "d3-tip")
                .offset([-8, 0])
                .html(function(d) { return "Date: "+d.year+"-"+(parseInt(d.month)+1)+"; max: " + d.max+" min: " + d.min; });
            svg.call(tool_tip);

            var changtem=function(operation="minimum"){

                var cards = svg.append("g").selectAll(".day")
                    .data(wholedata, function(d) {return d.month+':'+d.year;})
                    .enter();
                // console.log(d3.max(data.month[0], function (d) { return d.max; }));

                cards.append("rect")
                    .attr("x", function(d) { return (d.year - 1997) * gridSize; })
                    .attr("y", function(d) { return (d.month) * gridSize; })
                    .attr("rx", 4)
                    .attr("ry", 4)
                    .attr("class", "year bordered")
                    .attr("width", gridSize)
                    .attr("height", gridSize)
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
                .enter().append("g").append("text")
                .text(function (d) { return d; })
                .attr("class", "mono")
                .attr("x", 4)
                .attr("y", height+64);

            var legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), function(d) { return d; })
                .enter().append("g")
                .attr("class", "legend");

            legend.append("rect")
                .attr("x", function(d, i) { return legendElementWidth * i+62; })
                .attr("y", height+50)
                .attr("width", legendElementWidth)
                .attr("height", gridSize / 2)
                .style("fill", function(d, i) { return colors[i]; });

            legend.append("text")
                .attr("class", "mono")
                .text(function(d) { return "≥ " + Math.round(d); })
                .attr("x", function(d, i) { return legendElementWidth * i+62; })
                .attr("y", height+50 + gridSize);

            legend.exit().remove();

        });
};

heatmapChart(datasets[0]);


