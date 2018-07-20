// `data` provided by data.js
import * as d3 from 'd3';
import 'd3-selection-multi';
import _ from 'lodash';
import moment from 'moment';
import uuidv4 from 'uuid/v4';

import data from './data';
import './styles/viz.css';

window.exportData = () => console.log(data);
window.addMilestone = () => {
  const newIndex = data.length;
  const startDate = _(data).map(ms => ms.endDate).max();
  data.push({
    id: uuidv4(),
    title: `M${newIndex + 1}`,
    startDate,
    endDate: moment(startDate) + moment.duration(7, 'day'),
    editable: true,
  });
  update(data);
}

const width = self.frameElement ? innerWidth : 1000;
const height = self.frameElement ? innerHeight : 600;

const svg = d3.select("#viz")
  .append("svg")
  .attrs({
    width,
    height,
  });
svg.append('g').classed('xAxis', true);
svg.append('g').classed('yAxis', true);

function update(data) {
  const { x, y } = updateAxes(data);
  updateBars(data, x, y);
  updateLines(data, x, y);
  updateLineLabels(data, x, y);
}

function updateAxes(data) {
  const x = d3.scaleTime()
    .domain([
      d3.min(data.map((x) => x.startDate)),
      d3.max(data.map((x) => x.endDate))
    ])
    .range([150, width - 50]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.id))
    .rangeRound([50, height - 100]);

  const xAxis = d3.axisBottom(x)
    .ticks(6)
    .tickFormat(d3.timeFormat('%a %b %d'));

  svg.selectAll('g.xAxis')
    .attrs({
      transform: `translate(0, ${y.range()[1]})`,
    })
    .transition()
    .call(xAxis);

  const yAxis = d3.axisLeft(y)
    .tickFormat(milestoneId => _.find(data, x => x.id === milestoneId).title);

  svg.selectAll('g.yAxis')
    .attrs({
      transform: `translate(${x.range()[0]}, 0)`,
    })
    .transition()
    .call(yAxis);

  return { x, y };
}

function updateBars(data, x, y) {
  // JOIN
  const bars = svg.selectAll('rect.milestoneBar')
    .data(data);

  // ENTER + UPDATE
  bars.enter()
    .append('rect')
  .merge(bars)
    .classed('milestoneBar', true)
    .classed('editable', d => d.editable)
    .transition()
      .attrs(d => ({
        x: x(d.startDate),
        y: y(d.id),
        height: y.bandwidth(),
        width: x(d.endDate) - x(d.startDate),
        milestoneId: d.id,
      }))

  // EXIT
  bars.exit().remove();
}

function updateLines(data, x, y) {
  // JOIN
  const lines = svg.selectAll("line.endLine")
    .data(data);

  // ENTER + UPDATE
  lines.enter()
    .append("line")
  .merge(lines)
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
          // adjust line label
          d3.selectAll(`text[milestoneId='${milestoneId}']`)
            .attrs({
              x: d3.event.x,
            })
            .text(d => moment(x.invert(d3.event.x)).format('ddd MMM D'));

          // adjust previous milestone bar's end position
          d3.selectAll(`rect[milestoneId='${milestoneId}']`)
            .attrs({
              width: d3.event.x - x(d.startDate)
            });

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
            d3.selectAll(`text[milestoneId='${nextMilestone.id}']`)
              .attrs({
                x: x(nextMilestone.endDate) + delta,
              })
              .text(d => moment(x.invert(x(nextMilestone.endDate) + delta)).format('ddd MMM D'));
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

        // save this milestone's enddate
        data[milestoneIndex].endDate = x.invert(d3.event.x);

        // save all future milestone dates
        while (milestoneIndex + 1 < data.length) {
          const nextMilestone = data[milestoneIndex + 1];
          nextMilestone.startDate = x.invert(x(nextMilestone.startDate) + delta);
          nextMilestone.endDate = x.invert(x(nextMilestone.endDate) + delta);

          milestoneIndex += 1;
        }

        // toggle update, since x axis may be redrawn
        update(data);
      })
    )
    .classed('endLine', true)
    .classed('editable', d => d.editable)
    .transition()
      .attrs(d => ({
        x1: x(d.endDate),
        y1: y.range()[0],
        x2: x(d.endDate),
        y2: y.range()[1],
        milestoneId: d.id,
      }));

  // EXIT
  lines.exit().remove();
}

function updateLineLabels(data, x, y) {
  // JOIN
  const lineLabels = svg.selectAll("text.endLineLabel")
    .data(data);

  // ENTER + UPDATE
  lineLabels.enter()
    .append("text")
  .merge(lineLabels)
    .classed('endLineLabel', true)
    .transition()
    .attrs(d => ({
      x: x(d.endDate),
      y: y.range()[0] - 5,
      milestoneId: d.id,
    }))
    .text(d => moment(d.endDate).format('ddd MMM D'));

  // EXIT
  lineLabels.exit().remove();
}

update(data);
