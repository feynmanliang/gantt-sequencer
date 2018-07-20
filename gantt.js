// `data` provided by data.js

const width = self.frameElement ? 800 : innerWidth;
const height = self.frameElement ? 500 : innerWidth;

const svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const x = d3.scaleTime()
  .domain([
    d3.min(data.map((x) => x.startDate)),
    d3.max(data.map((x) => x.endDate))
  ])
  .range([100, 700]);

const y = d3.scaleBand()
  .rangeRound([100, 400])
  .domain(data.map(d => d.id));

const xAxis = d3.axisBottom(x)
  .ticks(10);

svg.append('g')
  .attr("transform", "translate(0, 400)")
  .call(xAxis);

const bars = svg.selectAll('rect')
  .data(data);
bars.enter().append('rect')
  .attrs({
    x: (d) => x(d.startDate),
    y: (d) => y(d.id),
    height: 10,
    width: (d) => x(d.endDate) - x(d.startDate),
    milestoneId: d => d.id,
  })
bars.exit().remove();

const lines = svg.selectAll("line.endLine")
  .data(data);

lines.enter()
  .append("line")
  .call(d3.drag()
    .on('drag', function (d) {
      const milestoneId = d3.select(this).attr('milestoneId');

      if (moment(x.invert(d3.event.x) - d.startDate) >= moment.duration(1, 'day')) {
        // adjust line position
        d3.selectAll(`line[milestoneId='${milestoneId}']`)
          .attrs({
            x1: d3.event.x,
            x2: d3.event.x
          });
        // adjust previous milestone bar's end position
        d3.selectAll(`rect[milestoneId='${milestoneId}']`)
          .attr('width', d3.event.x - x(d.startDate))

        // move all future milestone dates
        const delta = d3.event.x - x(d.endDate)
        let milestoneIndex = data
          .map(d => d.id)
          .indexOf(milestoneId);
        while (milestoneIndex + 1 < data.length) {
          const nextMilestone = data[milestoneIndex + 1];
          d3.selectAll(`line[milestoneId='${nextMilestone.id}']`)
            .attrs({
              x1: x(nextMilestone.endDate) + delta,
              x2: x(nextMilestone.endDate) + delta,
            });
          d3.selectAll(`rect[milestoneId='${nextMilestone.id}']`)
            .attrs({
              x: x(nextMilestone.startDate) + delta,
            });

          milestoneIndex += 1;
        }
      } else {
        console.log("Milestones cannot be shorter than 1 day")
      }
    })
    .on('end', function (d) {
      // update `data` to make sure view is consistent
      const milestoneId = d3.select(this).attr('milestoneId');
      const delta = d3.event.x - x(d.endDate)
      let milestoneIndex = data
        .map(d => d.id)
        .indexOf(milestoneId);

      // sate this milestone's enddate
      data[milestoneIndex].endDate = x.invert(d3.event.x);

      // save all future milestone dates
      while (milestoneIndex + 1 < data.length) {
        const nextMilestone = data[milestoneIndex + 1];
        nextMilestone.startDate = x.invert(x(nextMilestone.startDate) + delta);
        nextMilestone.endDate = x.invert(x(nextMilestone.endDate) + delta);

        milestoneIndex += 1;
      }
    })
  )
  .attrs({
    x1: d => x(d.endDate),
    y1: 0,
    x2: d => x(d.endDate),
    y2: 400,
    "stroke-width": 3,
    "stroke-dasharray": "10,10",
    stroke: "black",
    milestoneId: d => d.id,
  }).classed({
    endLine: true,
  });
lines.exit().remove();
