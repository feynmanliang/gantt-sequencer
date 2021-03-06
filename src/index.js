import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';

import * as d3 from 'd3';
import 'd3-selection-multi';
import _ from 'lodash';
import moment from 'moment';
import uuidv4 from 'uuid/v4';

import milestones from './data';
import './styles/viz.css';

let data = _.cloneDeep(milestones);

window.exportData = () => console.log(data);
window.addMilestone = () => {
  console.log(data)
  const newIndex = data.length;
  const startDate = _(data).map(ms => ms.endDate).max();
  data.push({
    id: uuidv4(),
    title: `M${newIndex + 1}`,
    startDate,
    endDate: moment(startDate) + moment.duration(7, 'day'),
    editable: true,
  });
  console.log(data)
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

function update(newData) {
  const { x, y } = updateAxes(newData);
  updateBars(newData, x, y);
  updateLines(newData, x, y);
  updateLineLabels(newData, x, y);
}

function updateAxes(newData) {
  const x = d3.scaleTime()
    .domain([
      d3.min(newData.map((x) => x.startDate)),
      d3.max(newData.map((x) => x.endDate))
    ])
    .range([150, width - 50]);

  const y = d3.scaleBand()
    .domain(newData.map(d => d.id))
    .rangeRound([50, height - 100]);

  const xAxis = d3.axisBottom(x)
    .ticks(6)
    .tickFormat(d3.timeFormat('%a %b %d'));

  svg.selectAll('.xAxis')
    .attrs({
      transform: `translate(0, ${y.range()[1]})`,
    })
    .transition()
    .call(xAxis);

  const yAxis = d3.axisLeft(y)
    .tickFormat(milestoneId => _.find(newData, x => x.id === milestoneId).title);

  svg.selectAll('.yAxis')
    .attrs({
      transform: `translate(${x.range()[0]}, 0)`,
    })
    .transition()
    .call(yAxis);

  return { x, y };
}

function updateBars(newData, x, y) {
  // JOIN
  const bars = svg.selectAll('.milestoneBar')
    .data(newData, d => d.id);

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

  // Attach onClick handlers
  svg.selectAll('.milestoneBar.editable')
    .on('click', function(d) {
      const index = _.findIndex(data, ms => ms.id === d.id);
      if (index + 1 < data.length) {
        data[index + 1].startDate = d.startDate
      }
      data = data.filter(ms => ms.id !== d.id);
      update(data);
    })

  // EXIT
  bars.exit().remove();
}

function updateLines(newData, x, y) {
  // JOIN
  const lines = svg.selectAll(".endLine")
    .data(newData, d => d.id);

  // ENTER + UPDATE
  lines.enter()
    .append("line")
  .merge(lines)
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

  // Attach drag handlers
  svg.selectAll(".endLine.editable")
    .call(d3.drag()
      .on('drag', function (d) {
        const milestoneId = d3.select(this).attr('milestoneId');

        if (moment(x.invert(d3.event.x) - d.startDate) >= moment.duration(1, 'day')) {
          // adjust line position
          d3.selectAll(`.endLine[milestoneId='${milestoneId}']`)
            .attrs({
              x1: d3.event.x,
              x2: d3.event.x
            });
          // adjust line label
          d3.selectAll(`.endLineLabel[milestoneId='${milestoneId}']`)
            .attrs({
              x: d3.event.x,
            })
            .text(d => moment(x.invert(d3.event.x)).format('ddd MMM D'));

          // adjust previous milestone bar's end position
          d3.selectAll(`.milestoneBar[milestoneId='${milestoneId}']`)
            .attrs({
              width: d3.event.x - x(d.startDate)
            });

          // move all future milestone dates
          const delta = d3.event.x - x(d.endDate)
          let milestoneIndex = newData
            .map(d => d.id)
            .indexOf(milestoneId);
          while (milestoneIndex + 1 < newData.length) {
            const nextMilestone = newData[milestoneIndex + 1];
            d3.selectAll(`.endLine[milestoneId='${nextMilestone.id}']`)
              .attrs({
                x1: x(nextMilestone.endDate) + delta,
                x2: x(nextMilestone.endDate) + delta,
              });
            d3.selectAll(`.endLineLabel[milestoneId='${nextMilestone.id}']`)
              .attrs({
                x: x(nextMilestone.endDate) + delta,
              })
              .text(d => moment(x.invert(x(nextMilestone.endDate) + delta)).format('ddd MMM D'));
            d3.selectAll(`.milestoneBar[milestoneId='${nextMilestone.id}']`)
              .attrs({
                x: x(nextMilestone.startDate) + delta,
              });

            milestoneIndex += 1;
          }
        } else {
          // TODO: visible error
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

  // EXIT
  lines.exit().remove();
}

function updateLineLabels(newData, x, y) {
  // JOIN
  const lineLabels = svg.selectAll("text.endLineLabel")
    .data(newData, d => d.id);

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
