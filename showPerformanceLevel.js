if (document.getElementById("benchmark-ul") == null) {

    var githubUL = document.getElementsByClassName("pagehead-actions flex-shrink-0 d-none d-md-inline")[0];

    if (githubUL != undefined) {

        // CONSTS AND FUNCTIONS /////////////////////////////////////////////////////////////////////////
        const environment = {
            baseUrl: "http://165.22.81.102:8080/",
            benchmark: "OSS",
            metrics: {},
            OSSBenchmark: {},
            DORABenchmark: {}
        }

        function getCurrentProject() {
            var URLSplit = window.location.href;
            if (URLSplit.charAt(URLSplit.length - 1) == "/") {
                URLSplit = URLSplit.slice(0, -1);
            }
            URLSplit = URLSplit.split("/");
            return URLSplit[3] + "/" + URLSplit[4];
        }

        function disableNewRequestButton() {
            var button = document.getElementById("benchmark-my-project-button");
            var span = document.getElementById("benchmark-my-project-button-span");
            span.textContent = "Benchmark has been requested";
            button.style.setProperty("pointer-events", "none");
            button.style.setProperty("user-select", "none");
            button.style.setProperty("background-color", "#343942");
        }

        function newRequest() {

            var data = { address: getCurrentProject() };
            var b = {
                method: "POST",
                body: JSON.stringify(data)
            }
            fetch(environment.baseUrl + "requests/new",
                {
                    method: "POST",
                    body: JSON.stringify(data)
                }).then(res => {
                    if (res.ok) {
                        return res.json();
                    }
                }).then(json => {
                    if (json.created == true) {
                        disableNewRequestButton();
                    } else {
                        console.log("No request sent");
                    }
                }).catch(err => console.log(err));

        }

        function setLevelOSS() {
            environment.benchmark = "OSS";
            showLevel();
        }

        function setLevelDORA() {
            environment.benchmark = "DORA";
            showLevel();
        }

        function classifyMetrics(benchmark, metrics) {

            const levels = {
                releaseFrequency: "",
                leadTimeForReleasedChanges: "",
                timeToRepairCode: "",
                bugIssuesRate: ""
            };

            const selectedBenchmark = benchmark || {};

            Object.keys(metrics).forEach((metric) => {
                const value = metrics[metric];
                const limits = selectedBenchmark[metric];
                if (value > limits[1]) {
                    levels[metric] = "lowLevel";
                } else if (value >= limits[0] && value <= limits[1]) {
                    levels[metric] = "mediumLevel";
                } else if (value < limits[0]) {
                    levels[metric] = "highLevel";
                } else {
                    levels[metrics[metric]] = "Nan";
                }
            });

            return levels;
        }

        function changeArrows(levels) {
            Object.keys(levels).forEach((metric) => {
                if (levels[metric] == "lowLevel") {
                    var svg = document.getElementById(metric + "-level");
                    svg.style.transform = 'rotate(180deg)';
                    var arrow1 = document.getElementById(metric + "-level-arrow-1");
                    var arrow2 = document.getElementById(metric + "-level-arrow-2");
                    arrow1.setAttribute("stroke", '#c30e2e');
                    arrow2.setAttribute("stroke", '#c30e2e');
                } else if (levels[metric] == "mediumLevel") {
                    var svg = document.getElementById(metric + "-level");
                    svg.style.transform = 'rotate(90deg)';
                    var arrow1 = document.getElementById(metric + "-level-arrow-1");
                    var arrow2 = document.getElementById(metric + "-level-arrow-2");
                    arrow1.setAttribute("stroke", '#F1E05A');
                    arrow2.setAttribute("stroke", '#F1E05A');
                } else if (levels[metric] == "highLevel") {
                    var svg = document.getElementById(metric + "-level");
                    svg.style.transform = 'rotate(0deg)';
                    var arrow1 = document.getElementById(metric + "-level-arrow-1");
                    var arrow2 = document.getElementById(metric + "-level-arrow-2");
                    arrow1.setAttribute("stroke", '#238636');
                    arrow2.setAttribute("stroke", '#238636');
                } else {
                    console.log("No data");
                }
            });
        }

        function changeBenchmarkIcon() {
            fetch(chrome.runtime.getURL("elements/" + environment.benchmark + "iconSVG.html")).then(icon => {
                if (icon.ok) {
                    return icon.text();
                }
            }).then(res => {
                var div = document.getElementById("benchmark-icon");
                div.innerHTML = res;
            }).catch(err => console.log(err));
        }

        function formatToNumbers(dict) {

            const result = {};

            for (const key in dict) {
                const value = dict[key];
                const match = value.match(/\d+(\.\d+)?/g);
                result[key] = [parseFloat(match[0]), parseFloat(match[1])];
            }

            return result;

        }

        function showLevel() {

            if (environment.benchmark == "OSS") {
                var levels = classifyMetrics(environment.OSSBenchmark, environment.metrics);

                changeArrows(levels);
                changeBenchmarkIcon();

            } else {
                var levels = classifyMetrics(environment.DORABenchmark, environment.metrics);

                changeArrows(levels);
                changeBenchmarkIcon();

            }

        }

        /////////////////////////////////////////////////////////////////////////////////////////////////

        var newDiv = document.createElement("div");

        fetch(environment.baseUrl + "projects/" + getCurrentProject() + "/metrics",
            {
                method: "GET",
            }).then(res => {
                if (res.ok) {
                    return res.json();
                }
            }).then(json => {
                if (json.exists == true && json.completed == true) {
                    fetch(chrome.runtime.getURL("elements/benchmark-data.html")).then(benchmark => {
                        if (benchmark.ok) {
                            return benchmark.text();
                        }
                    }).then(benchmarkHTML => {
                        newDiv.innerHTML = benchmarkHTML;
                        githubUL.parentNode.parentNode.insertBefore(newDiv, githubUL.parentNode.nextSibling);

                        environment.metrics.releaseFrequency = json.releaseFrequency;
                        environment.metrics.leadTimeForReleasedChanges = json.leadTimeForReleasedChanges;
                        environment.metrics.timeToRepairCode = json.timeToRepairCode;
                        environment.metrics.bugIssuesRate = json.bugIssuesRate;

                        document.getElementById("release-frequency").textContent = json.releaseFrequency + " days";
                        document.getElementById("lead-time-for-released-changes").textContent = json.leadTimeForReleasedChanges + " days";
                        document.getElementById("time-to-repair-code").textContent = json.timeToRepairCode + " days";
                        document.getElementById("bug-issues-rate").textContent = json.bugIssuesRate + " %";

                        document.getElementById("OSS-button").addEventListener("click", setLevelOSS);
                        document.getElementById("DORA-button").addEventListener("click", setLevelDORA);

                        fetch(environment.baseUrl + "benchmarks/all",
                            {
                                method: "GET",
                            }).then(res => {
                                if (res.ok) {
                                    return res.json();
                                }
                            }).then(json => {
                                environment.OSSBenchmark = formatToNumbers(json.OSS);
                                environment.DORABenchmark = formatToNumbers(json.DORA);

                                var levels = classifyMetrics(environment.OSSBenchmark, environment.metrics);
                                changeArrows(levels);
                            }).catch(err => console.log(err));
                    }).catch(err => console.log(err));
                } else {
                    fetch(chrome.runtime.getURL("elements/benchmark-no-data.html")).then(benchmark => {
                        if (benchmark.ok) {
                            return benchmark.text();
                        }
                    }).then(benchmarkHTML => {
                        newDiv.innerHTML = benchmarkHTML;
                        githubUL.parentNode.parentNode.insertBefore(newDiv, githubUL.parentNode.nextSibling);
                        document.getElementById("release-frequency").textContent = "-.--" + " days";
                        document.getElementById("lead-time-for-released-changes").textContent = "-.--" + " days";
                        document.getElementById("time-to-repair-code").textContent = "-.--" + " days";
                        document.getElementById("bug-issues-rate").textContent = "-.--" + " %";

                        if(json.exists == false){
                            document.getElementById("benchmark-my-project-button").addEventListener("click", newRequest);
                        } else {
                            disableNewRequestButton();
                        }

                    }).catch(err => console.log(err));
                }
            }).catch(err => console.log(err));
    }

}

