'use strict';

const NUM_DEMOGRAPHICS = 6;

var demographics = [];
var num_people = 0;

function make_number(id, min=0, max=100, value=50, step=0.1) {
	let input = document.createElement('input');
	input.setAttribute('type', 'number');

	input.id = id;
	input.setAttribute('name', id);

	input.setAttribute('min', min);
	input.setAttribute('max', max);
	input.setAttribute('value', value);
	input.setAttribute('step', step);

	let size = 5;
	if (step < 0.1) {
		size = 8;
	}
	input.setAttribute('size', size);

	return input;
}

function make_slider(id, min=0, max=100, value=50, step=0.1) {
	let input = document.createElement('input');
	input.setAttribute('type', 'range');

	input.id = id;
	input.setAttribute('name', id);

	input.setAttribute('min', min);
	input.setAttribute('max', max);
	input.setAttribute('value', value);
	input.setAttribute('step', step);

	return input;
}

function make_demographics_row(idx, name, enabled=true) {

	let tr = document.createElement('tr');

	let checkbox = document.createElement('input');
	checkbox.setAttribute('type', 'checkbox');
	checkbox.checked = enabled;
	checkbox.setAttribute('name', name + '_enabled');
	checkbox.setAttribute('id', name + '_enabled');

	let text_category = document.createElement('input');
	text_category.setAttribute('type', 'text');
	text_category.setAttribute('size', '10');
	text_category.setAttribute('value', 'Category ' + (1 + idx));
	text_category.setAttribute('name', name + '_category_name');
	text_category.setAttribute('id', name + '_category_name');
	text_category.addEventListener('change', (event) => { update_table_head(); })

	let text_a = document.createElement('input');
	text_a.setAttribute('type', 'text');
	text_a.setAttribute('size', '10');
	text_a.setAttribute('value', 'A');
	text_a.setAttribute('name', name + '_label_a');
	text_a.setAttribute('id', name + '_label_a');
	// text_a.addEventListener('change', (event) => { clear_all(); });

	let text_b = document.createElement('input');
	text_b.setAttribute('type', 'text');
	text_b.setAttribute('size', '10');
	text_b.setAttribute('value', 'B');
	text_b.setAttribute('name', name + '_label_b');
	text_b.setAttribute('id', name + '_label_b');
	// text_b.addEventListener('change', (event) => { clear_all(); });

	let number_a = make_number(name + '_probability_a');
	let number_b = make_number(name + '_probability_b');
	let slider = make_slider(name + '_slider');

	number_a.addEventListener('change', (event) => {
		number_b.value = 100 - number_a.value;
		slider.value = number_a.value;
	});
	number_b.addEventListener('change', (event) => {
		number_a.value = 100 - number_b.value;
		slider.value = number_a.value;
	});
	slider.addEventListener('change', (event) => {
		let val_a = parseFloat(slider.value);
		let val_b = 100 - val_a;
		// Round to 0.1, but remove trailing ".0"
		number_a.value = parseFloat(val_a.toFixed(1));
		number_b.value = parseFloat(val_b.toFixed(1));
	});

	checkbox.addEventListener('change', (event) => { clear_all(); });

	let td;

	td = document.createElement('td');
	td.appendChild(checkbox);
	tr.appendChild(td);

	td = document.createElement('td');
	td.appendChild(text_category);
	tr.appendChild(td);

	td = document.createElement('td');
	td.appendChild(text_a);
	td.appendChild(document.createElement('br'));
	td.appendChild(number_a);
	tr.appendChild(td);

	td = document.createElement('td');
	td.appendChild(slider);
	tr.appendChild(td);

	td = document.createElement('td');
	td.appendChild(text_b);
	td.appendChild(document.createElement('br'));
	td.appendChild(number_b);
	tr.appendChild(td);

	td = document.createElement('td');
	td.id = name + '_results_a';
	td.classList.add('result_cell');
	tr.appendChild(td);

	td = document.createElement('td');
	td.id = name + '_results_b';
	td.classList.add('result_cell');
	tr.appendChild(td);

	// TODO: pie chart
	// td = document.createElement('td');
	// td.id = name + '_pie_chart';
	// td.appendChild(td);

	let dem = document.getElementById("demographics_body");
	dem.appendChild(tr);
}

function iterate_all_demographics(f) {
	for (let idx = 0; idx < NUM_DEMOGRAPHICS; ++idx) {
		let name = 'demographic_' + idx;
		let checkbox = document.getElementById(name + '_enabled');
		let enabled = undefined;
		if (checkbox) {
			enabled = checkbox.checked;
		}
		f(idx, name, enabled);
	}
}
function iterate_all_enabled_demographics(f) {
	iterate_all_demographics((idx, name, enabled) => {
		if (enabled) {
			f(idx, name);
		}
	});
}

function update_table_head() {
	console.log('update_table_head()');

	let tr = document.createElement('tr');
	let th = document.createElement('th');
	th.innerText = '#';
	tr.appendChild(th);

	iterate_all_enabled_demographics((idx, name) => {
		let label = document.getElementById(name + '_category_name').value;
		let th = document.createElement('th');
		th.innerText = label;
		tr.appendChild(th);
	});

	let thead = document.getElementById('results_head');
	thead.innerHTML = '';
	thead.appendChild(tr);
}

function reset_table() {
	update_table_head();

	let tbody = document.getElementById('results_body');

	// This can be slow when the table is very large (TODO: would looping and removing one by one be faster?)
	console.log('Clearing table...');
	tbody.innerHTML = '';
	console.log('Done clearing table');
}

function reset_stats() {
	console.log('reset_stats()');

	num_people = 0;
	demographics = [];
	iterate_all_demographics((idx, name, enabled) => {
		demographics.push([0, 0]);
	});
	// console.log(demographics);

	iterate_all_demographics((idx, name, enabled) => {
		let label_a = document.getElementById(name + '_label_a').value;
		let label_b = document.getElementById(name + '_label_b').value;

		let results_a = document.getElementById(name + '_results_a');
		let results_b = document.getElementById(name + '_results_b');

		if (enabled) {
			results_a.innerHTML = label_a + '<br>&nbsp;<br>&nbsp;';
			results_b.innerHTML = label_b + '<br>&nbsp;<br>&nbsp;';
		} else {
			results_a.innerHTML = '&nbsp;<br>&nbsp;<br>&nbsp;';
			results_b.innerHTML = '&nbsp;<br>&nbsp;<br>&nbsp;';
		}
	});
}

function on_ready() {
	iterate_all_demographics((idx, name, enabled) => {
		make_demographics_row(idx, name, idx == 0);
	});
	reset_stats();
	reset_table();
}

function pick_one() {
	pick(1);
}

function pick_many() {
	pick(document.getElementById("pick_many_number").value);
}

function pick(n) {
	console.log('pick(' + n + ')');
	for (let i = 0; i < n; ++i) {
		_pick_one();
	}
}

function _pick_one()
{
	let tbody = document.getElementById('results_body');
	let tr = document.createElement('tr');

	num_people += 1;
	let td = document.createElement('td');
	td.innerText = num_people;
	tr.appendChild(td);

	iterate_all_enabled_demographics((idx, name) => {
		let probability_a = document.getElementById(name + '_probability_a').value / 100.0;
		// let probability_b = document.getElementById(name + '_probability_b').value / 100.0;

		let label_a = document.getElementById(name + '_label_a').value;
		let label_b = document.getElementById(name + '_label_b').value;
		let results_a = document.getElementById(name + '_results_a');
		let results_b = document.getElementById(name + '_results_b');

		let td = document.createElement('td');

		let r = Math.random();
		if (r < probability_a) {
			td.innerText = label_a;
			demographics[idx][0] += 1;
		} else {
			td.innerText = label_b;
			demographics[idx][1] += 1;
		}

		tr.appendChild(td);

		let val_a = demographics[idx][0];
		let val_b = demographics[idx][1];

		let pct_a = val_a / num_people * 100.0;
		let pct_b = val_b / num_people * 100.0;

		results_a.innerText = `${label_a}\n${val_a} / ${num_people}\n${pct_a.toFixed(1)} %`;
		results_b.innerText = `${label_b}\n${val_b} / ${num_people}\n${pct_b.toFixed(1)} %`;
	});

	tbody.appendChild(tr);
}

function clear_all() {
	console.log('clear_all()');
	reset_stats();
	reset_table();
}

$( document ).ready(on_ready);
