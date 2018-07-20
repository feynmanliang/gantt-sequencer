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
  .range([150, 700]);

const y = d3.scaleBand()
  .domain(data.map(d => d.id))
  .rangeRound([50, 400]);


const xAxis = d3.axisBottom(x)
  .ticks(d3.timeWeek.every(1))
  .tickFormat(d3.timeFormat('%a %b %d'));
svg.append('g')
  .attr("transform", `translate(0, ${y.range()[1]})`)
  .call(xAxis);

const yAxis = d3.axisLeft(y)
  .tickFormat(milestoneId => _(data).find(x => x.id === milestoneId).title);
svg.append('g')
  .attr("transform", `translate(${x.range()[0]}, 0)`)
  .call(yAxis);


const bars = svg.selectAll('rect')
  .data(data);
bars.enter().append('rect')
  .attrs({
    x: (d) => x(d.startDate),
    y: (d) => y(d.id),
    height: y.bandwidth(),
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
          .attr('width', d3.event.x - x(d.startDate));

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
        console.error("Milestones cannot be shorter than 1 day")
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
    y1: y.range()[0],
    x2: d => x(d.endDate),
    y2: y.range()[1],
    "stroke-width": 3,
    "stroke-dasharray": "10,10",
    stroke: "black",
    milestoneId: d => d.id,
  }).classed({
    endLine: true,
  });
lines.exit().remove();
