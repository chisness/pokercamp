/* global d3 */
/* global unlock_next */

var infoSets, states;

function loadJSON(file) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file, false);  // false makes the request synchronous
    xhr.send(null);
    if (xhr.status === 200) {
        return JSON.parse(xhr.responseText);
    } else {
        throw new Error('Failed to load ' + file);
    }
}

try {
    infoSets = loadJSON('https://static.rossry.net/sketches/poker/kuhn3/infosets.json');
    states = loadJSON('https://static.rossry.net/sketches/poker/kuhn3/states.json');
    
    // Your main code that uses infoSets and states can now follow here
    console.log(infoSets);
    console.log(states);
} catch (error) {
    console.error('Error loading JSON:', error);
}

const evLabel = (ev) => {
  return ev ? (ev<0?"":"+") + Number(ev.toFixed(2)) : "0";
};

const pLabel = (p) => {
  return p ? Number((p * 100).toFixed(1)) + "%" : "0%";
};

const weightLabel = (weight) => {
  return weight ? Number((weight * 100).toFixed(0)) + "%" : "0%";
};

const ctrLabel = (ctr) => {
  return ctr ? Number(ctr.toFixed(2)) : "0.00";
};

var data = {"name": "Deal", "children": []};

function p1_win(s) {
    if (s.charAt(2) == "↑" && s.charAt(3) == "↓") {
        return 1;
    }
    if (s.charAt(2) == "↓" && s.charAt(3) == "↑" && s.charAt(4) == "↓") {
        return -1;
    }
    return s.charAt(0) < s.charAt(1) ? 1 : -1;
}

var act1_parity = false;
for (var name of ["AK", "AQ", "KQ", "KA", "QA", "QK"]) {
    var tree0 = {"name": name, "children": []};
    act1_parity = !act1_parity;
    for (var act1 of act1_parity ? ["↑", "↓"] : ["↓", "↑"]) {
        var tree1 = {"name": name+act1, "children": []};
        if (act1_parity && act1 == "↓") {
            tree1.children.push({"name": name+act1+"↓", "children": [], "payoff": p1_win(name+act1+"↓") * 1});
        }
        if (act1 == "↓") {
            tree1.children.push({
                "name": name+act1+"↑",
                "children": [
                    {"name": name+act1+"↑"+"↑", "children": [], "payoff": p1_win(name+act1+"↑"+"↑") * 2},
                    {"name": name+act1+"↑"+"↓", "children": [], "payoff": p1_win(name+act1+"↑"+"↓") * 1},
                ],
            });
        } else {
            tree1.children.push({"name": name+act1+"↑", "children": [], "payoff": p1_win(name+act1+"↑") * 2});
        }
        if (!(act1_parity && act1 == "↓")) {
            tree1.children.push({"name": name+act1+"↓", "children": [], "payoff": p1_win(name+act1+"↓") * 1});
        }
        tree0.children.push(tree1);
    }
    data.children.push(tree0);
}

function calculateEV() {
    const calculateStateEV = (stateKey) => {
        const state = states[stateKey];

        if (state.ev === undefined) {
          if (state.hasOwnProperty('payoff')) {
              state.ev = state.payoff;
          } else {
              const infoSet = infoSets[state.infoSet];
              const percentage = infoSet.percentage / 100;
              const evUp = calculateStateEV(state.up);
              const evDown = calculateStateEV(state.down);
              const newEv = percentage * evUp + (1 - percentage) * evDown;
              state.ev = newEv;
          }
        }
        return state.ev;
    };

    for (const stateKey in states) {
        calculateStateEV(stateKey);
    }

    for (const infoSetKey in infoSets) {
      const infoSet = infoSets[infoSetKey];
      const infoSetEv = infoSets[infoSetKey].states.reduce((sum, stateKey) => {
        const state = states[stateKey];
        const normalizedP = state.p / infoSet.p;
        return sum + (normalizedP * state.ev);
      }, 0);
      infoSets[infoSetKey].ev = infoSetEv;
    }
}

function calculateProbabilities() {
    const initProbabilities = {
        "A_": 1 / 3,
        "K_": 1 / 3,
        "Q_": 1 / 3
    };

    const updateStateProbability = (stateKey, prob) => {
      const state = states[stateKey];
      state.p = prob;

      document.querySelectorAll("." + stateKey).forEach(element => {
        const density = Math.pow(6 * prob, 1 / (stateKey.length - 2));
        element.style.opacity = 0.15 + 0.85 * density;
      });

      if (state.hasOwnProperty('payoff')) {
          return;
      }

      const infoSet = infoSets[state.infoSet];
      const pUp = prob * (infoSet.percentage / 100);
      const pDown = prob * (1 - (infoSet.percentage / 100));

      updateStateProbability(state.up, pUp);
      updateStateProbability(state.down, pDown);
      
      document.querySelectorAll(".action_" + stateKey + "_↑").forEach(element => {
        const density = Math.pow(6 * pUp, 1 / (stateKey.length - 1));
        element.style.opacity = 0.05 + 0.95 * density;
      });
      document.querySelectorAll(".action_" + stateKey + "_↓").forEach(element => {
        const density = Math.pow(6 * pDown, 1 / (stateKey.length - 1));
        element.style.opacity = 0.05 + 0.95 * density;
      });
    };

    for (const infoSetKey of Object.keys(initProbabilities)) {
        const infoSet = infoSets[infoSetKey];
        const initialProb = initProbabilities[infoSetKey];

        infoSet.p = initialProb;
        infoSet.states.forEach((stateKey) => {
            updateStateProbability(stateKey, initialProb / infoSet.states.length);
        });
    }
    for (const infoSetKey in infoSets) {
      const infoSet = infoSets[infoSetKey];
      infoSet.p = infoSet.states.reduce((sum, stateKey) => sum + states[stateKey].p, 0);
    }
}

function recalculateEvs() {
    for(const infoSetKey in infoSets) {
      infoSets[infoSetKey].ev = undefined;
      infoSets[infoSetKey].p = undefined;
    }

    for(const stateKey in states) {
      states[stateKey].ev = undefined;
      states[stateKey].p = undefined;
    }

    calculateProbabilities();
    calculateEV();
    
    for(const stateKey in states) {
      const state = states[stateKey];
      document.querySelectorAll(".p" + stateKey).forEach(element => {
        element.textContent = `p: ${pLabel(state.p)}`;
      });
      document.querySelectorAll(".ev" + stateKey).forEach(element => {
        element.textContent = `EV: ${evLabel(state.ev)}`;
      });
    }
    for(const infoSetKey in infoSets) {
      document.querySelectorAll(".p" + infoSetKey).forEach(element => {
        element.textContent = `visit prob: ${pLabel(infoSets[infoSetKey].p)}`;
      });
      
      document.querySelectorAll(".ev" + infoSetKey).forEach(element => {
        element.textContent = `EV: ${evLabel(infoSets[infoSetKey].ev)}`;
      });
      const evUp = calculateDirectionEV(infoSets[infoSetKey], "up");
      const evDown = calculateDirectionEV(infoSets[infoSetKey], "down");
      document.querySelectorAll(".ev_↑_" + infoSetKey).forEach(element => {element.textContent = evLabel(evUp); });
      document.querySelectorAll(".ev_↓_" + infoSetKey).forEach(element => {element.textContent = evLabel(evDown); });
      document.querySelectorAll(".ev_inverse_↑_" + infoSetKey).forEach(element => {element.textContent = -evLabel(evUp); });
      document.querySelectorAll(".ev_inverse_↓_" + infoSetKey).forEach(element => {element.textContent = -evLabel(evDown); });
      
      document.querySelectorAll(".regret" + infoSetKey).forEach(element => {
        element.textContent = `ΣCFR: ${ctrLabel(infoSets[infoSetKey].total_regret)}`;
      });
      
      document.querySelectorAll(".weight" + infoSets[infoSetKey].states[0]).forEach(element => {
        element.textContent = `${weightLabel(states[infoSets[infoSetKey].states[0]].p / infoSets[infoSetKey].p)}`;
      });
      document.querySelectorAll(".weight" + infoSets[infoSetKey].states[1]).forEach(element => {
        element.textContent = `${weightLabel(states[infoSets[infoSetKey].states[1]].p / infoSets[infoSetKey].p)}`;
      });
    }
}

function calculateDirectionEV(infoSet, direction) {
    const state1 = states[infoSet.states[0]];
    const state2 = states[infoSet.states[1]];
    return (state1.p / infoSet.p) * states[state1[direction]].ev + (state2.p / infoSet.p) * states[state2[direction]].ev;
}

function getFavoredAction(infoSetKey) {
    const infoSet = infoSets[infoSetKey];

    const evUp = calculateDirectionEV(infoSet, "up");
    const evDown = calculateDirectionEV(infoSet, "down");

    if (evUp > evDown + Number(document.getElementById("tolerance").value)) {
        if (infoSet.percentage === (infoSet.inverse ? 0 : 100)) {
            return null;
        } else {
            return infoSet.inverse ? "↓" : "↑";
        }
    } else if (evUp < evDown - Number(document.getElementById("tolerance").value)) {
        if (infoSet.percentage === (infoSet.inverse ? 100 : 0)) {
            return null;
        } else {
            return infoSet.inverse ? "↑" : "↓";
        }
    } else {
        return null;
    }
}

function getFavoredActionMagnitude(infoSetKey) {
    const infoSet = infoSets[infoSetKey];

    const evUp = calculateDirectionEV(infoSet, "up");
    const evDown = calculateDirectionEV(infoSet, "down");

    return Math.abs(evUp - evDown);
}

function showFavoredActions() {
    document.querySelectorAll(".strategy").forEach(element => {
        element.style.backgroundColor = "";
    });
    
    var all_clear = true;
    for(const infoSetKey in infoSets) {
        const favoredAction = getFavoredAction(infoSetKey);
        if(favoredAction) {
          all_clear = false;
          document.querySelectorAll(
            ".strategy_" + infoSetKey + "_" + favoredAction
          ).forEach(element => {
            element.style.backgroundColor = "#FFFFBB";
          });
        }
    }
    
    if (all_clear) {
      unlock_next();
    }
}

var stop_running;

function startSimulator() {
    const iterations = Number(document.getElementById("num_iterations").value);
    const waitPerStep = Number(document.getElementById("wait_per_step").value);

    function runIteration(i, onComplete) {
        if (i >= iterations || stop_running) {
          onComplete();
          return;
        }

        const updateFactor = Number(document.getElementById("update_mode").value);

        Array.from(document.getElementsByClassName("strategy_input")).forEach(input => {
            if (!input.id) return;
            
            const label = input.getAttribute("data-label");
            const favoredAction = getFavoredAction(label);
            
            if (!favoredAction) return;
            
            const curValue = parseFloat(input.value.replace("%", "").trim());
            infoSets[label].total_regret += getFavoredActionMagnitude(label) * infoSets[label].p;
            infoSets[label].percentage =
                curValue
                +
                (
                    (favoredAction === "↑" ? 100 - curValue : - curValue)
                    * getFavoredActionMagnitude(label)
                    * infoSets[label].p
                    / infoSets[label].total_regret
                    * updateFactor
                )
                +
                (Math.random() - 0.5) * 0.001
            ;
            // findme
            infoSets[label].percentage = Math.max(0, Math.min(100, infoSets[label].percentage));
            document.querySelectorAll(
              "." + input.id
            ).forEach(element => {
              element.value = (+infoSets[label].percentage.toFixed(3)) + "%";
            });
            document.querySelectorAll(
              "." + input.id.substring(0, input.id.length - 1) + "↓"
            ).forEach(element => {
              element.value = +(100 - infoSets[label].percentage).toFixed(3) + "%";
            });
        });

        recalculateEvs();
        showFavoredActions();

        setTimeout(() => runIteration(i + 1, onComplete), waitPerStep);
    }
    
    const startButton = document.getElementById("start_simulator");
    const originalButtonText = startButton.innerHTML;
    
    stop_running = false;
    startButton.innerHTML = "Stop";
    startButton.onclick = function() {
        stop_running = true;
    };
    
    // Start the simulation
    runIteration(0, function() {
      startButton.innerHTML = originalButtonText;
      startButton.onclick = startSimulator;
      stop_running = false;
    });
}

const createSubtreeVisualization = (root, name1, name2, label, is_p1) => {
  const infoSet = infoSets[label];
  infoSet.total_regret = 0;

  const color = is_p1 ? "green" : "purple";

  const subtreeData1 = root.descendants().find(d => d.data.name === name1);
  const subtreeData2 = root.descendants().find(d => d.data.name === name2);

  if (!subtreeData1 || !subtreeData2) return;

  const subtree1 = {
    name: subtreeData1.data.name,
    children: subtreeData1.children ? subtreeData1.children.map(child => ({
      name: child.data.name,
      children: (child.children ? child.children.map(grandchild => ({name: grandchild.data.name, children: [], payoff: null})) : [{name: "", children: [], payoff: null}, {name: "", children: [], payoff: null}]).sort((a, b) => d3.descending(a.name, b.name)),
      payoff: child.data.payoff
    })).sort((a, b) => d3.descending(a.name, b.name)) : []
  };

  const subtree2 = {
    name: subtreeData2.data.name,
    children: subtreeData2.children ? subtreeData2.children.map(child => ({
      name: child.data.name,
      children: child.children ? child.children.map(grandchild => ({name: grandchild.data.name, children: [], payoff: null})) : [{name: "", children: [], payoff: null}, {name: "", children: [], payoff: null}],
      payoff: child.data.payoff
    })).sort((a, b) => d3.descending(a.name, b.name)) : []
  };

  const subtreeWidth = 140;
  const subtreeHeight = 70;
  const subtreeMargin = { top: 15, right: 11, bottom: -13, left: -10 };
  const svgWidth = subtreeWidth * 1.7 + subtreeMargin.left + subtreeMargin.right;
  const svgHeight = subtreeHeight + subtreeMargin.top + subtreeMargin.bottom;

  const subtreeDiv = d3.select("#subtree_visualization")
    .append("div").attr("style", "width: 280px; max-width: 35vh; height: auto; max-height:25vh; margin-bottom: 1em; font: 13px sans-serif; overflow: hidden; display: inline-block; border:1px solid black; margin-right: 1em; padding: 0.5em;");
  const subtreeSvg = subtreeDiv
    .append("svg")
    .attr("width", svgWidth + 40)
    .attr("height", svgHeight + 40)
    .attr("style", "margin-bottom: 0.6em")
    .append("g")
    .attr("transform", `translate(${subtreeMargin.left + 15},${subtreeMargin.top + 20})`)
    .attr("viewBox", [0, 0, subtreeWidth, subtreeHeight])
    .attr("style", "width: 190px; max-width: 33vh; height: auto; max-height:25vh; font: 13px sans-serif; overflow: hidden; display: block");
  
  
  // Create tree layouts
  const treeLayout = d3.tree().size([
    subtreeWidth - 20,
    subtreeHeight * 1.6 - 20
  ]);

  const root1 = d3.hierarchy(subtree1);
  treeLayout(root1);

  const root2 = d3.hierarchy(subtree2);
  treeLayout(root2);

  const displayEV = (node, stateName, xMod = 0, yMod = 0) => {
    const state = stateName in states ? states[stateName] : infoSets[stateName];
    const displayEv = evLabel(state.ev);
    node.append("text")
      .attr("class", "ev" + stateName + " " + stateName)
      .attr("x", xMod)
      .attr("y", yMod - 12) // Adjust the y position to be above the state
      .attr("dy", "0.31em")
      .attr("text-anchor", "middle")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("fill", "black")
      .attr("font-weight", "bold")
      .attr("opacity", 1)
      .attr("font-size", "10px") // Make the text smaller
      .text(`EV: ${displayEv}`);
  };
  const displayP = (node, stateName, xMod = 0, yMod = 0) => {
    node.append("text")
      .attr("class", "p" + stateName)
      .attr("x", xMod)
      .attr("y", yMod - 30) // Adjust the y position to be above the state
      .attr("dy", "0.31em")
      .attr("text-anchor", "middle")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("fill", color)
      .attr("opacity", 1)
      .attr("font-size", "10px")
      .text("");
  };
  const displayWeight = (node, stateName, infoSetName, xMod = 0, yMod = 0) => {
    const state = states[stateName];
    const infoset = infoSets[infoSetName];
    const displayWeight = weightLabel(state.p / infoset.p);
    node.append("text")
      .attr("class", "weight" + stateName)
      .attr("x", xMod)
      .attr("y", yMod - 18) // Adjust the y position to be above the state
      .attr("dy", "0.31em")
      .attr("text-anchor", "middle")
      .attr("fill", color)
      .attr("opacity", 1)
      .attr("font-size", "15px")
      .text(`${displayWeight}`);
  };
  const displayRegret = (node, infoSetName, xMod = 0, yMod = 0) => {
    node.append("text")
      .attr("class", "regret" + infoSetName)
      .attr("x", xMod)
      .attr("y", yMod - 18) // Adjust the y position to be above the state
      .attr("dy", "0.31em")
      .attr("text-anchor", "middle")
      .attr("fill", color)
      .attr("opacity", 1)
      .attr("font-size", "10px")
      .text("");
  };

  // Append links and nodes for first subtree
  const g1 = subtreeSvg.append("g")
    .attr("transform", `translate(0,0)`);

  g1.selectAll(".link")
    .data(root1.links())
    .enter()
    .filter(d => d.target.data.name !== "")
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .style("opacity", 0.575)
    .attr("class", d => {return "action_" + d.target.data.name.slice(0, -1) + "_" + d.target.data.name.slice(-1); })
    .attr("stroke-width", 1.5)
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y));

  g1.selectAll(".node")
    .data(root1.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .each(function(d) {
      
      const node = d3.select(this);
      
      // Append node text
      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("fill", "white")
        .text(d => d.data.name);
      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("fill", "currentColor")
        .attr("class", d => d.data.name)
        .text(d => d.data.name);
    
    if (d.data.children.length) {
      if (d.data.children[0].length === 0) {
          displayEV(node, d.data.name);
      } else {
        displayWeight(node, d.data.name, label);
      }
    }

      // Append payoff labels with colored circles
      if (d.data.payoff !== undefined) {
        const offset = (d.data.name.length == 4 ? 17 : 19) + (Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92);

        // Append circle
        node.append("circle")
          .attr("cx", offset)
          .attr("cy", 1)
          .attr("r", Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92)
          .attr("class", d => d.data.name)
          .attr("fill", d.data.payoff > 0 ? "blue" : "red");

        // Append text
        node.append("text")
          .attr("x", offset)
          .attr("y", 1)
          .attr("text-anchor", "middle")
          .attr("dy", "0.34em")
          .attr("fill", "white")
          .attr("font-size", "6px")
          .attr("font-weight", "bold")
          .text(d => (d.data.payoff > 0 ? "+" : "–") + Math.abs(d.data.payoff));
      }
    });

  // Append links and nodes for second subtree
  const g2 = subtreeSvg.append("g")
    .attr("transform", `translate(${subtreeWidth * 0.7 + 25},0)`);

  g2.selectAll(".link")
    .data(root2.links())
    .enter()
    .filter(d => d.target.data.name !== "")
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .style("opacity", 0.575)
    .attr("class", d => {return "action_" + d.target.data.name.slice(0, -1) + "_" + d.target.data.name.slice(-1); })
    .attr("stroke-width", 1.5)
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y));

  g2.selectAll(".node")
    .data(root2.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .each(function(d) {
      const node = d3.select(this);

      // Append node text
      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("fill", "white")
        .text(d => d.data.name);
      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("fill", "currentColor")
        .attr("class", d => d.data.name)
        .text(d => d.data.name);

    if (d.data.children.length) {
      if (d.data.children[0].length === 0) {
          displayEV(node, d.data.name);
      } else {
        displayWeight(node, d.data.name, label);
      }
    }

      // Append payoff labels with colored circles
      if (d.data.payoff !== undefined) {
        const offset = (d.data.name.length == 4 ? 17 : 19) + (Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92);

        // Append circle
        node.append("circle")
          .attr("cx", offset)
          .attr("cy", 1)
          .attr("r", Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92)
          .attr("class", d => d.data.name)
          .attr("fill", d.data.payoff > 0 ? "blue" : "red");

        // Append text
        node.append("text")
          .attr("x", offset)
          .attr("y", 1)
          .attr("text-anchor", "middle")
          .attr("dy", "0.34em")
          .attr("fill", "white")
          .attr("font-size", "6px")
          .attr("font-weight", "bold")
          .text(d => (d.data.payoff > 0 ? "+" : "–") + Math.abs(d.data.payoff));
      }
    });

  // Append infoset path
  const pos1 = { x: subtreeWidth * 0.5 - 25, y: 0 };
  const pos2 = { x: subtreeWidth * 1.2 + 25, y: 0 };

  const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
  const r = 12;
  const dx = r * Math.sin(angle);
  const dy = r * Math.cos(angle);
  
  const pathData = `M${pos1.x - dx},${pos1.y + dy}
                    A${r},${r} 0 0,1 ${pos1.x + dx},${pos1.y - dy}
                    L${pos2.x + dx},${pos2.y - dy}
                    A${r},${r} 0 0,1 ${pos2.x - dx},${pos2.y + dy}
                    Z`;
  
  subtreeSvg.append("path")
    .attr("d", pathData)
    .attr("fill", color)
    .attr("opacity", 0.3); // Light color with lower opacity
  
  // Calculate midpoint
  const midX = (pos1.x + pos2.x) / 2;
  const midY = (pos1.y + pos2.y) / 2;
  
  // Add label at midpoint
  subtreeSvg.append("text")
    .attr("x", midX)
    .attr("y", midY)
    .attr("dy", "0.31em")
    .attr("text-anchor", "middle")
    .attr("fill", color)
    .attr("font-weight", "bold")
    .attr("opacity", 1) // Darker color with full opacity
    .text(label);
  displayRegret(subtreeSvg, label, midX, midY);
  displayP(subtreeSvg, label, midX, midY);
  
    
  const evDown = calculateDirectionEV(infoSet, "down");
  const evUp = calculateDirectionEV(infoSet, "up");

  subtreeDiv.append("span").text("↓Down: ").classed("action", true);
  const downDiv = subtreeDiv.append("div").attr("style", "position: relative; display: inline-block; white-space: nowrap; margin-right: 1em");
  if (is_p1) {
    downDiv.append("span").html(`EV: <span class="ev_↓_${label} player_label p1">${evDown}</span>`).attr("style", "position: absolute; top: -1em; left: 0; font-size: 12px; font-weight: bold; margin-left: -3.9em;");
  } else {
    downDiv.append("span").html(`EV: <span class="ev_inverse_↓_${label} player_label p2">${evDown}</span> <span class="ev_↓_${label} player_label p1">${evDown}</span>`).attr("style", "position: absolute; top: -1em; left: 0; font-size: 12px; font-weight: bold; margin-left: -3.9em; max-width:10em; overflow-x: clip; overflow-y: visible;");
  }
  downDiv.append("input")
    .attr("id", "strategy_"+label+"_↓")
    .classed("strategy_"+label+"_↓", true)
    .classed("strategy", true)
    .attr("data-label", label)
    .attr("style", "width: 4em;")
  ;
  
  subtreeDiv.append("span").text("↑Up: ").classed("action", true);
  const upDiv = subtreeDiv.append("div").attr("style", "position: relative; display: inline-block; white-space: nowrap;");
  if (is_p1) {
    upDiv.append("span")
      .html(`EV: <span class="ev_↑_${label} player_label p1">${evUp}</span>`)
      .attr("style", "position: absolute; top: -1em; left: 0; font-size: 12px; font-weight: bold; margin-left: -2.3em;");
  } else {
    upDiv.append("span")
      .html(`EV: <span class="ev_inverse_↑_${label} player_label p2">${evUp}</span> <span class="ev_↑_${label} player_label p1">${evUp}</span>`)
      .attr("style", "position: absolute; top: -1em; left: 0; font-size: 12px; font-weight: bold; margin-left: -2.3em;");
  }
  upDiv.append("input")
    .attr("id", "strategy_"+label+"_↑")
    .classed("strategy_"+label+"_↑", true)
    .classed("strategy", true)
    .classed("strategy_input", true)
    .attr("data-label", label)
    .attr("style", "width: 4em;")
  ;
  
  document.querySelectorAll(".duplicate_" + label).forEach(element => {
    element.innerHTML = subtreeDiv.node().outerHTML;
    element.querySelectorAll('[id]').forEach(el => {
      el.removeAttribute('id');
    });
  });
  
  document.querySelectorAll(
    ".strategy_"+label+"_↓"
  ).forEach(element => {
    element.value = (100 - infoSet.percentage) + "%";
  });
  
  document.querySelectorAll(
    ".strategy_"+label+"_↑"
  ).forEach(element => {
    element.value = infoSet.percentage + "%";
  });

  // on change, find the other input and adjust its value so the sum is 100. if it's not a valid number between 0 and 100, outline the input in red
  const upSelector = document.querySelectorAll('.strategy_' + label + '_↑');
  const downSelector = document.querySelectorAll('.strategy_' + label + '_↓');
  upSelector.forEach(element => {
    element.onchange = function() {
      let newValue = parseFloat(this.value.replace("%", "").trim());
      if (newValue < 0 || newValue > 100 || isNaN(newValue)) {
        this.value = "0%";
        newValue = 0;
      }
      upSelector.forEach(element => {
          element.value = newValue + "%";
      });
      downSelector.forEach(element => {
          element.value = (100 - newValue) + "%";
      });
      infoSet.percentage = newValue;
      recalculateEvs();
      showFavoredActions();
    };
  });
  downSelector.forEach(element => {
    element.onchange = function() {
      let newValue = parseFloat(this.value.replace("%", "").trim());
      if (newValue < 0 || newValue > 100 || isNaN(newValue)) {
        this.value = "0%";
        newValue = 0;
      }
      downSelector.forEach(element => {
          element.value = newValue + "%";
      });
      const otherValue = 100 - newValue;
      upSelector.forEach(element => {
          element.value = otherValue + "%";
      });
      infoSet.percentage = otherValue;
      recalculateEvs();
      showFavoredActions();
    };
  });
};

function setupSVG(id_target, width, height, cx, cy) {
  return d3.select("#" + id_target)
    .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-cx, -cy, width, height])
      .attr("style", `width: ${width*1.4}px; height: ${height*1.4}px; max-width: 100%; max-height: 75vh; font: 10px sans-serif;`);
}

function drawLinks(svg, root, level) {
  svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 1.5)
    .selectAll()
    .data(root.links())
    .enter()
    .filter(d => d.target.depth <= Math.floor(level + 0.5) || d.source.depth === 0)
    .append("path")
      .attr("d", d => {
        if (d.source.depth === 0) {
          const angle = d.target.x;
          return `
            M0,0
            L${Math.cos(angle - Math.PI / 2) * d.target.y},${Math.sin(angle - Math.PI / 2) * d.target.y}
          `;
        } else {
          return d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y)(d);
        }
      })
      .style("opacity", 0.575)
      .attr("class", d => `action_${d.target.data.name.slice(0, -1)}_${d.target.data.name.slice(-1)}`);
}

function drawMidpointCircles(svg, root, level) {
  const radialLineGenerator = d3.linkRadial()
    .angle(d => d.x)
    .radius(d => d.y);

  svg.append("g")
    .selectAll("g")
    .data(root.links())
    .enter()
    .append("g")
    .filter(d => d.source.depth !== 0)
    .filter(d => d.target.depth <= Math.floor(level + 0.5))
    .each(function(d) {
      const lastChar = d.target.data.name.slice(-1);
      
      const group = d3.select(this);
      const path = radialLineGenerator(d);
      const tempPath = svg.append("path").attr("d", path).node();
      const pathLength = tempPath.getTotalLength();
      const lengthFraction = (d.target.depth === 2 && lastChar === "↑" && level >= 2.0) ? 0.3 : 0.5;
      const midpoint = tempPath.getPointAtLength(pathLength * lengthFraction);
      d3.select(tempPath).remove();


      group.append("circle")
        .attr("cx", midpoint.x)
        .attr("cy", midpoint.y)
        .attr("r", 4)
        .attr("fill", "#fff");
      group.append("circle")
        .attr("cx", midpoint.x)
        .attr("cy", midpoint.y)
        .attr("r", 4)
        .attr("fill", "#555")
        .style("opacity", 0.575)
        .attr("class", `action_${d.target.data.name.slice(0, -1)}_${d.target.data.name.slice(-1)}`);

      group.append("text")
        .attr("x", midpoint.x)
        .attr("y", midpoint.y)
        .attr("text-anchor", "middle")
        .attr("dy", "0.24em")
        .attr("fill", "white")
        .attr("font-size", "7.5px")
        .attr("font-weight", "bold")
        .text(lastChar);
    });
}

function drawLabels(svg, root, level) {
  svg.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll()
    .data(root.descendants())
    .enter()
    .filter(d => d.depth <= Math.floor(level + 0.25))
    .append("text")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x * -180 / Math.PI + 90})`)
      .attr("dy", "0.31em")
      .attr("text-anchor", "middle")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("fill", "white")
      .text(d => d.data.name);

  svg.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll()
    .data(root.descendants())
    .enter()
    .filter(d => d.depth <= Math.floor(level + 0.25))
    .append("text")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x * -180 / Math.PI + 90})`)
      .attr("dy", "0.31em")
      .attr("text-anchor", "middle")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("fill", "currentColor")
      .attr("class", d => d.data.name)
      .text(d => d.data.name);
}

function drawPayoffLabels(svg, root, level) {
  svg.append("g")
    .selectAll()
    .data(root.descendants())
    .enter()
    .filter(d => d.depth <= Math.floor(level + 0.25))
    .append("g")
      .filter(d => d.data.payoff !== undefined)
      .each(function(d) {
        const group = d3.select(this);
        const x = Math.cos(d.x - Math.PI / 2) * d.y;
        const y = Math.sin(d.x - Math.PI / 2) * d.y;
        const offset = (d.data.name.length == 4 ? 13 : 15) + (Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92);
        const payoffX = x + offset;

        group.append("circle")
          .attr("cx", payoffX)
          .attr("cy", y)
          // .attr("r", Math.abs(d.data.payoff) <= 1 ? 4 : 5.6)
          .attr("r", Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92)
          .attr("fill", "white");
        group.append("circle")
          .attr("cx", payoffX)
          .attr("cy", y)
          // .attr("r", Math.abs(d.data.payoff) <= 1 ? 4 : 5.6)
          .attr("r", Math.abs(d.data.payoff) <= 1 ? 5.6 : 7.92)
          .attr("class", d => d.data.name)
          .attr("fill", d.data.payoff > 0 ? "blue" : "red");

        group.append("text")
          .attr("x", payoffX)
          .attr("y", y)
          .attr("text-anchor", "middle")
          .attr("dy", "0.34em")
          .attr("fill", "white")
          .attr("font-size", Math.abs(d.data.payoff) <= 1 ? "6px" : "8px")
          .attr("font-weight", "bold")
          // .text(d => (d.data.payoff > 0 ? "+" : "–") + (Math.abs(d.data.payoff) > 1 ? Math.abs(d.data.payoff) : ""))
          .text(d => (d.data.payoff > 0 ? "+" : "–") + Math.abs(d.data.payoff));
      });
}

function create_tree(id_target, level = 10, with_strategy = false) {
  // Lookup table for dimensions
  const dimensionLookup = {
    1.0: { width: 130, height: 105, y_offset: 2 },
    1.5: { width: 260, height: 250, y_offset: 3 },
    2.0: { width: 260, height: 250, y_offset: 3 },
    2.5: { width: 420, height: 353, y_offset: 0 },
    3.0: { width: 410, height: 380, y_offset: -2 },
    3.5: { width: 520, height: 440, y_offset: -30 },
    4.0: { width: 520, height: 440, y_offset: -30 }
  };

  // Round level to nearest 0.5
  const roundedLevel = Math.round(level * 2) / 2;
  // Clamp level between 1.0 and 4.0
  const clampedLevel = Math.max(1.0, Math.min(4.0, roundedLevel));

  const { width, height, y_offset } = dimensionLookup[clampedLevel];
  var cx = 0.5 * width
  var cy = 0.5 * height + y_offset
  // var radius = Math.min(cx, cy)
  var radius = 240

  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 1.2) / a.depth);

  const root = tree(d3.hierarchy(data));

  root.descendants().forEach(d => {
    if (d.depth === 1) {
      d.y *= 0.75;
    } else if (d.depth === 2) {
      if (d.data.name.slice(-1) == "↓") {
        d.y *= 0.95;
      } else {
        d.y *= 0.99;
      }
    }
  });

  const svg = setupSVG(id_target, width, height, cx, cy);
  
  drawLinks(svg, root, level);
  drawMidpointCircles(svg, root, level);
  drawLabels(svg, root, level);
  drawPayoffLabels(svg, root, level);

  const addInfoset = (name1, name2, label, is_p1) => {
    const getPos = (name) => {
      const node = root.descendants().find(d => d.data.name === name);
      return node ? { x: Math.cos(node.x - Math.PI / 2) * node.y, y: Math.sin(node.x - Math.PI / 2) * node.y } : null;
    };

    const pos1 = getPos(name1);
    const pos2 = getPos(name2);

    if (pos1 && pos2) {
      const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
      const r = 12;
      const dx = r * Math.sin(angle);
      const dy = r * Math.cos(angle);

      const pathData = `M${pos1.x - dx},${pos1.y + dy}
                        A${r},${r} 0 0,1 ${pos1.x + dx},${pos1.y - dy}
                        L${pos2.x + dx},${pos2.y - dy}
                        A${r},${r} 0 0,1 ${pos2.x - dx},${pos2.y + dy}
                        Z`;

      const color = is_p1 ? "green" : "purple";

      svg.append("path")
        .attr("d", pathData)
        .attr("fill", color)
        .attr("opacity", 0.3);

      const midX = (pos1.x + pos2.x) / 2;
      const midY = (pos1.y + pos2.y) / 2;

      svg.append("text")
        .attr("x", midX)
        .attr("y", midY)
        .attr("dy", "0.31em")
        .attr("text-anchor", "middle")
        .attr("fill", color)
        .attr("font-weight", "bold")
        .attr("opacity", 1)
        .text(label);

      if (with_strategy) {
        createSubtreeVisualization(root, name1, name2, label, is_p1);
      }
    }
  };

  if (level >= 1.0) {
    addInfoset("AQ", "AK", "A_", true);
    addInfoset("KA", "KQ", "K_", true);
    addInfoset("QK", "QA", "Q_", true);
  }
  if (level >= 2.0) {
    addInfoset("QA↑", "KA↑", "_A↑", false);
    addInfoset("AK↑", "QK↑", "_K↑", false);
    addInfoset("KQ↑", "AQ↑", "_Q↑", false);
    addInfoset("QA↓", "KA↓", "_A↓", false);
    addInfoset("AK↓", "QK↓", "_K↓", false);
    addInfoset("KQ↓", "AQ↓", "_Q↓", false);
  }
  if (level >= 3.0) {
    addInfoset("AQ↓↑", "AK↓↑", "A_↓↑", true);
    addInfoset("KA↓↑", "KQ↓↑", "K_↓↑", true);
    addInfoset("QK↓↑", "QA↓↑", "Q_↓↑", true);
  }

  if (with_strategy) {
    recalculateEvs();
    showFavoredActions();
  }
}
