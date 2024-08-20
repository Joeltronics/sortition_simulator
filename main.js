'use strict';

const NUM_DEMOGRAPHICS = 6;
const MAX_NUM_CATEGORIES = 5;

var demographics = [];
var num_people = 0;

function round_01(val) {
	// Round to 0.1, but remove trailing ".0"
	return parseFloat(parseFloat(val).toFixed(1));
}

function is_empty_or_whitespace(str) {
	return str === null || str.match(/^ *$/) !== null;
}

function make_number(id, value=50, min=0, max=100, step=0.1) {
	let input = document.createElement('input');
	input.setAttribute('type', 'number');

	input.id = id;
	input.setAttribute('name', id);

	input.setAttribute('min', min);
	input.setAttribute('max', max);
	input.setAttribute('value', value);
	input.setAttribute('step', step);

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

function set_callbacks(category_probability_inputs, slider=null) {

	if (category_probability_inputs.length == 2) {

		let number_a = category_probability_inputs[0];
		let number_b = category_probability_inputs[1];

		number_a.addEventListener('change', (event) => {
			number_b.value = 100 - number_a.value;
			if (slider) {
				slider.value = number_a.value;
			}
		});

		number_b.addEventListener('change', (event) => {
			number_a.value = 100 - number_b.value;
			if (slider) {
				slider.value = number_a.value;
			}
		});

		if (slider) {
			slider.addEventListener('change', (event) => {
				let val_a = parseFloat(slider.value);
				let val_b = 100 - val_a;
				number_a.value = round_01(val_a);
				number_b.value = round_01(val_b);
			});
		}
	} else {
		// More than 2 - we need an "other" box

		let other_box = category_probability_inputs[category_probability_inputs.length - 1];

		for (let idx = 0; idx < category_probability_inputs.length - 1; ++idx) {
			let number = category_probability_inputs[idx];

			number.addEventListener('change', (event) => {

				let sum_non_other = 0;
				for (let n = 0; n < category_probability_inputs.length - 1; ++n) {
					sum_non_other += parseFloat(category_probability_inputs[n].value || 0);
				}

				const other_val = 100 - sum_non_other;

				for (let n = 0; n < category_probability_inputs.length - 1; ++n) {
					let input_n = category_probability_inputs[n];
					const max_val = parseFloat(input_n.value) + other_val;
					input_n.setAttribute('max', max_val.toFixed(1));
				}

				console.debug('sum of non-other', sum_non_other, 'other', other_val);

				other_box.value = round_01(other_val);

				// "readonly" inputs don't seem to get ":invalid" pseudo-class, so add it as a custom class
				if (other_val < 0) {
					other_box.classList.add('is_invalid');
				} else {
					other_box.classList.remove('is_invalid');
				}
			});
		}
	}
}

function make_demographics_row(idx, name, num_categories, enabled=true) {

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

	let category_text_boxes = [];
	let category_probabilities = [];
	for (let i = 0; i < num_categories; ++i) {

		const is_other = (i == MAX_NUM_CATEGORIES - 1);
		const default_category_name = is_other ? 'Other' : String.fromCharCode('A'.charCodeAt(0) + i);
		const default_probability = 100.0 / num_categories;

		let text = document.createElement('input');
		text.setAttribute('type', 'text');
		text.setAttribute('size', '10');
		text.setAttribute('value', default_category_name);
		text.setAttribute('name', name + '_label_' + i);
		text.setAttribute('id', name + '_label_' + i);
		text.addEventListener('change', (event) => { update_stats(); });
		category_text_boxes.push(text);

		let number = make_number(name + '_probability_' + i, default_probability);
		number.classList.add('probability_number');
		if (is_other) {
			number.setAttribute('readonly', true);
			number.classList.add('number_other');
		} else {
			number.addEventListener('change', (event) => { update_stats(); });
		}
		category_probabilities.push(number);
	}

	let slider;
	if (num_categories == 2) {
		slider = make_slider(name + '_slider');
	}

	set_callbacks(category_probabilities, slider);

	checkbox.addEventListener('change', (event) => { clear_all(); });

	const add_cell = (cell) => {
		let td = document.createElement('td');
		cell.forEach((elem) => { td.appendChild(elem);});
		tr.appendChild(td);
		return td;
	};

	add_cell([checkbox]);
	add_cell([text_category]);

	if (num_categories == 2) {
		add_cell([category_text_boxes[0], document.createElement('br'), category_probabilities[0]]);
		add_cell(slider ? [slider] : []).setAttribute('colspan', MAX_NUM_CATEGORIES - 2);
		add_cell([category_text_boxes[1], document.createElement('br'), category_probabilities[1]]);
	} else {
		for (let i = 0; i < num_categories; ++i) {
			add_cell([category_text_boxes[i], document.createElement('br'), category_probabilities[i]]);
		}
	}

	for (let i = 0; i < num_categories; ++i) {
		let td = document.createElement('td');
		td.id = name + '_results_' + i;
		td.classList.add('result_cell');
		tr.appendChild(td);
	}

	let dem = document.getElementById("demographics_body");
	dem.appendChild(tr);
}

function iterate_all_demographics(f) {
	for (let idx = 0; idx < NUM_DEMOGRAPHICS; ++idx) {

		const num_categories = (idx == 0) ? MAX_NUM_CATEGORIES : 2;

		let name = 'demographic_' + idx;
		let checkbox = document.getElementById(name + '_enabled');
		let enabled = undefined;
		if (checkbox) {
			enabled = checkbox.checked;
		}
		f(idx, name, num_categories, enabled);
	}
}

function iterate_all_enabled_demographics(f) {
	iterate_all_demographics((idx, name, num_categories, enabled) => {
		if (enabled) {
			f(idx, name, num_categories);
		}
	});
}

function update_table_head() {
	console.log('update_table_head()');

	let tr = document.createElement('tr');
	let th = document.createElement('th');
	th.innerText = '#';
	tr.appendChild(th);

	iterate_all_enabled_demographics((idx, name, num_categories) => {
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

	// This can be slow when the table is very large, but now we only show up to 1000 people so it's not so bad
	console.log('Clearing table...');
	tbody.innerHTML = '';
	console.log('Done clearing table');
}

function update_stats() {
	iterate_all_demographics((idx, name, num_categories, enabled) => {
		for (let i = 0; i < num_categories; ++i) {

			let results = document.getElementById(name + '_results_' + i);

			const label = document.getElementById(name + '_label_' + i).value;

			let this_category_enabled = enabled;
			if (enabled && num_categories > 2) {
				const probability = parseFloat(document.getElementById(name + '_probability_' + i).value) || 0;
				const empty = is_empty_or_whitespace(label);
				if (empty && probability <= 0) {
					console.debug(`Category ${name} ${i} is not enabled`);
					this_category_enabled = false;
				} else if (empty) {
					console.debug(`Category ${name} ${i} is empty, but probability is not <= 0`);
				}
			}

			if (!this_category_enabled) {
				results.innerHTML = '&nbsp;<br>&nbsp;<br>&nbsp;';

			} else if (num_people <= 0) {
				// Prevent injection - update as text, then append HTML
				results.innerText = label;
				results.innerHTML += '<br>&nbsp;<br>&nbsp;';	

			} else {
				const val = demographics[idx][i];
				const pct = val / num_people * 100.0;
				results.innerText = `${label}\n${val} / ${num_people}\n${pct.toFixed(1)} %`;
			}
		}
	});
}

function reset_stats() {
	console.log('reset_stats()');

	num_people = 0;
	demographics = [];
	iterate_all_demographics((idx, name, num_categories, enabled) => {
		let dem = [];
		for (let i = 0; i < num_categories; ++i) {
			dem.push(0);
		}
		demographics.push(dem);
	});

	update_stats();
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
	update_stats();
}

function _pick_one()
{
	num_people += 1;

	let tbody = document.getElementById('results_body');

	// Only show up to 1000 people - it gets too slow otherwise
	let tr;
	const is_ellipsis_row = num_people == 1001;
	if (num_people <= 1001) {
		tr = document.createElement('tr');

		let td = document.createElement('td');
		td.innerText = is_ellipsis_row ? '...' : num_people;
		tr.appendChild(td);
	}

	iterate_all_enabled_demographics((idx, name, num_categories) => {

		const r = Math.random();

		let selected_idx = -1;
		if (num_categories == 2)
		{
			const probability_a = document.getElementById(name + '_probability_0').value / 100.0;
			if (r < probability_a) {
				selected_idx = 0;
			} else {
				selected_idx = 1;
			}
		}
		else
		{
			let sum_prob = 0;
			for (let i = 0; i < num_categories; ++i) {
				const probability_this_category = Math.max(0, document.getElementById(name + '_probability_' + i).value / 100.0);
				sum_prob += probability_this_category

				if (r < sum_prob) {
					selected_idx = i;
					break;
				}
			}
		}

		if (selected_idx < 0) {
			console.warn('Failed to select! r=' + r);
		}
		else {
			demographics[idx][selected_idx] += 1;
		}

		if (tr) {
			let td = document.createElement('td');
			if (!is_ellipsis_row) {
				td.innerText = document.getElementById(name + '_label_' + selected_idx).value;
			}
			tr.appendChild(td);
		}
	});

	if (tr) {
		tbody.appendChild(tr);
	}
}

function clear_all() {
	console.log('clear_all()');
	reset_stats();
	reset_table();
}

function main() {
	iterate_all_demographics((idx, name, num_categories, enabled) => {
		make_demographics_row(idx, name, num_categories, idx <= 1);
	});
	reset_stats();
	reset_table();
}
