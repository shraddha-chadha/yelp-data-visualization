'use strict';
const CancelToken = axios.CancelToken;
let pendingAPIRating = [];
const selector = '#rating-charts';
const e = React.createElement;

class RatingCharts extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedCuisines: [],
            selectedStates: [],
            token: 0
        }
    }

    onCuisineSelect(cuisineList) {
        this.setState({
            selectedCuisines: cuisineList
        });
    }

    onStateSelect(stateList) {
        let number_pending_api = pendingAPIRating.length;
        if (number_pending_api > 0) {
            // Cancel all
            for (let i = number_pending_api - 1; i >= 0; i--) {
                pendingAPIRating[i].cancel("Cancelled the previous API calls by the user");
                pendingAPIRating.pop()
            }
        }
        this.setState({
            selectedStates: stateList,
            token: CancelToken.source()
        });
    }

    drawChart(data, selector) {
        $(selector).empty();
        let dataset = data;

        var diameter = 600;
        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var bubble = d3.pack(dataset)
            .size([diameter, diameter])
            .padding(1.5);

        var svg = d3.select(selector)
            .append("svg")
            .attr("width", "100%")
            .attr("height", 600)
            .attr("class", "bubble")
            .append("g")
            .attr("transform", function (d) {
                return "translate(150, 0)"
            });

        var nodes = d3.hierarchy(dataset)
            .sum(function (d) {
                return d.Count;
            });

        var node = svg.selectAll(".node")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function (d) {
                return !d.children
            })
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        node.append("title")
            .text(function (d) {
                return d.Name + ": " + d.Count;
            });

        node.append("circle")
            .transition()
            .duration(2000)
            .attr("r", function (d) {
                return d.r;
            })
            .style("stroke", "black")
            .style("fill", function (d, i) {
                let colors = ["#3082BD", "#6BAED6", "#E55632", "#F08C38", "#52A456",
                    "#74C475", "#756BB1", "#9E9AC8", "#636363"];
                switch (d.data.Name) {
                    case "1":
                        return colors[0];
                        break;
                    case "1.5":
                        return colors[1];
                        break;
                    case "2":
                        return colors[2];
                        break;
                    case "2.5":
                        return colors[3];
                        break;
                    case "3":
                        return colors[4];
                        break;
                    case "3.5":
                        return colors[5];
                        break;
                    case "4":
                        return colors[6];
                        break;
                    case "4.5":
                        return colors[7];
                        break;
                    case "5":
                        return colors[8];
                        break;
                    default:
                        return colors[9];
                }
            });

        node.append("text")
            .attr("dy", "-1em")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.data.State;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function (d) {
                return d.r / 5;
            })
            .transition()
            .duration(2500)
            .attr("fill", "#000");

        node.append("text")
            .attr("dy", ".2em")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.data.Name.substring(0, d.r / 3);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function (d) {
                return d.r / 5;
            })
            .transition()
            .duration(2500)
            .attr("fill", "#000");

        node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.data.Count;
            })
            .attr("font-family", "Gill Sans", "Gill Sans MT")
            .attr("font-size", function (d) {
                return d.r / 5;
            })
            .transition()
            .duration(2500)
            .attr("fill", "#000");

        d3.select(self.frameElement)
            .style("height", diameter + "px");
    }

    render() {
    if (this.state.selectedCuisines.length && this.state.selectedStates.length)
    {
        let token = this.state.token;
        pendingAPIRating.push(token);
        $("#ratings-chart").html('Loading...');
        let url = '/api/restaurants';
        url = url + '?state=' + this.state.selectedStates.join(',');
        let bubbleChartData = [];

        //Get data
        axios.get(url,
            {
                cancelToken: token.token
            }
            )
            .then((response) => {
                var index = pendingAPIRating.indexOf(token);
                if (index !== -1) {
                    pendingAPIRating.splice(index, 1);
                }
                let len = response.data.results.length;
            let dataTemp = {};
            for (let i = 0; i < len; i++) {
                let item = response.data.results[i];
                if (item.stars && item.state)
                {
                    let key = item.stars + ',' + item.state;

                    if(key in dataTemp) {
                        dataTemp[key] = dataTemp[key] + 1;
                    } else {
                        dataTemp[key] = 1;
                    }
                }
            }

            for (let key in dataTemp) {
                let newkeys = key.split(',');
                let temp = {};
                temp['Name'] = newkeys[0];
                temp['State'] = newkeys[1];
                temp['Count'] = dataTemp[key];
                bubbleChartData.push(temp);
            }
            console.log(bubbleChartData);

            if(response.data.count == 0) {
                $("#ratings-chart").html('No Data Available. Please try changing filters');

            } else {
                this.drawChart({ "children": bubbleChartData}, "#ratings-chart");
            }

        }).catch(function(thrown) {
            if (axios.isCancel(thrown)) {
                console.log('Request canceled', thrown.message);
            }

            })
    }

    return (
        <div className="container p-0">
            <div className="row view-container">
                <div className="col-md cuisine-filter chart-filters">
                        <CuisineDropdown onCuisineSelect={this.onCuisineSelect.bind(this)}/>
                </div>
                {this.state.selectedCuisines.length ? (
                        <div className="col-md state-filter chart-filters">
                           <StateDropdown isMultiSelect="true" onStateSelect={this.onStateSelect.bind(this)}/>
                        </div>
                    ): (null)
                 }

            </div>
            <div className="row">
                <div className="col-md w-100" id="ratings-chart"></div>
            </div>
        </div>
    );
  }
}

const domContainer = document.querySelector(selector);
ReactDOM.render(e(RatingCharts), domContainer);