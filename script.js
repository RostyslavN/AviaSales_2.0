// get elements from page
const formSearch = document.querySelector('.form-search'),
	inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
	dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
	inputCitiesTo = formSearch.querySelector('.input__cities-to'),
	dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
	inputDateDepart = formSearch.querySelector('.input__date-depart'),
	cheapestTicket = document.getElementById('cheapest-ticket'),
	otherCheapTickets = document.getElementById('other-cheap-tickets'),
	modalWindow = document.querySelector('#modal-window'),
	modalClose = document.querySelector('.modal-close'),
	modalText = document.querySelector('.modal-text');

//data:
const citiesApi = 'http://api.travelpayouts.com/data/en/cities.json',
// const citiesApi = 'dataBase/cities(en).json',
	proxy = 'https://cors-anywhere.herokuapp.com/',
	API_KEY = 'fb83fbb51ec78362a1f00aafeb7e5439',
	calendar = 'http://min-prices.aviasales.ru/calendar_preload',
	MAX_COUNT = 5;

let city = [];

//functions
const getData = (url, callback, reject = console.error) => {
	const request = new XMLHttpRequest();
	request.open('GET', url);

	request.addEventListener('readystatechange', () => {
		if (request.readyState !== 4) return;

		if (request.status === 200) {
			callback(request.response);
		} else {
			reject(request.status);
		}
	});
	request.send();
};

const showCity = (input, list) => {
	list.textContent = '';

	if (input.value === '') return;
	const filterCity = city.filter((item) => {
		const fixItem = item.name.toLowerCase();
		return fixItem.startsWith(input.value.toLowerCase());
	})

	filterCity.forEach((item) => {
		const li = document.createElement('li');
		li.classList.add('dropdown__city');
		li.textContent = `${item.name}, ${item.code}`;
		list.append(li);
	})
};

const selectCity = (event, input, list) => {
	const target = event.target;
	if (target.tagName.toLowerCase() !== 'li') return;
	input.value = target.textContent;
	list.textContent = '';
};

const getNameCity = (code) => {
	const objCity = city.find((item) => item.code === code);
	return objCity.name;
};

const getDate = (date) => {
	return new Date(date).toLocaleString('uk', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	});
};

const getChanges = (num) => {
	if (num) {
		return num === 1 ? 'With one change' : 'With two changes';
	} else {
		return 'Without changes';
	}
};

const getLinkAviasales = (data) => {
	let link = 'https://www.aviasales.ru/search/';
	link += data.origin;
	const date = new Date(data.depart_date);

	const day = date.getDate();
	link += day < 10 ? '0' + day : day;

	const month = date.getMonth() + 1;
	link += month < 10 ? '0' + month : month;

	link += data.destination;
	link += '1';
	return link;
};

const createCard = (data) => {
	const ticket = document.createElement('article');
	ticket.classList.add('ticket');

	let deep = '';
	if (data) {
		deep = `
			<h3 class="agent">${data.gate}</h3>
			<div class="ticket__wrapper">
				<div class="left-side">
					<a href="${getLinkAviasales(data)}" target="_blank" class="button button__buy">Buy
						for ${Math.round(data.value)}$</a>
				</div>
				<div class="right-side">
					<div class="block-left">
						<div class="city__from">Departure from the city of
							<span class="city__name">${getNameCity(data.origin)}</span>
						</div>
						<div class="date">${getDate(data.depart_date)}</div>
					</div>
		
					<div class="block-right">
						<div class="changes">${getChanges(data.number_of_chages)}</div>
						<div class="city__to">Destination city:
							<span class="city__name">${getNameCity(data.destination)}</span>
						</div>
					</div>
				</div>
			</div>
		`;
	} else {
		deep = '<h3>Unfortunately, no tickets were found at the current date.</h3>'
	}
	ticket.insertAdjacentHTML('afterbegin', deep);
	return ticket;
};

const renderCheapDay = (cheapTicket) => {
	cheapestTicket.innerHTML = '<h2>Cheapest tickets on this date</h2>';

	const ticket =  createCard(cheapTicket[0]);
	cheapestTicket.append(ticket);
};

const renderCheapYear = (cheapTickets) => {
	otherCheapTickets.innerHTML = '<h2>Cheapest tickets on other dates</h2> ';
	cheapTickets.sort((a, b) => {
		if (a.depart_date > b.depart_date) {
			return 1;
		}
		if (a.depart_date < b.depart_date) {
			return -1;
		}
		return 0;
	});
	
	for (let i = 0; i < cheapTickets.length && i < MAX_COUNT; i++) {
		const ticket = createCard(cheapTickets[i]);
		otherCheapTickets.append(ticket);
	}
};

const renderCheap = (data, date) => {
	const cheapTicketsYear = JSON.parse(data).best_prices;

	const cheapTicketDay = cheapTicketsYear.filter((item) => {
		return item.depart_date === date;
	});

	renderCheapDay(cheapTicketDay);
	renderCheapYear(cheapTicketsYear);
};

//events handlers
inputCitiesFrom.addEventListener('input', () => {
	showCity(inputCitiesFrom, dropdownCitiesFrom)
});

dropdownCitiesFrom.addEventListener('click', (event) => {
	selectCity(event, inputCitiesFrom, dropdownCitiesFrom)
});

inputCitiesTo.addEventListener('input', () => {
	showCity(inputCitiesTo, dropdownCitiesTo)
});

dropdownCitiesTo.addEventListener('click', (event) => {
	selectCity(event, inputCitiesTo, dropdownCitiesTo)
});

formSearch.addEventListener('submit', (event) => {
	event.preventDefault();
	const formData = {
		from: city.find(item => inputCitiesFrom.value === `${item.name}, ${item.code}`),
		to: city.find(item => inputCitiesTo.value === `${item.name}, ${item.code}`),
		when: inputDateDepart.value,
	}

	if (formData.from && formData.to) {
		const requestData = `?origin=${formData.from.code}&destination=${formData.to.code}&depart_date=${formData.when}&one_way=true&currency=usd&lang=uk`;

		getData(calendar + requestData, (response) => {
			renderCheap(response, formData.when);
		}, error => {
			cheapestTicket.textContent = '';
			otherCheapTickets.textContent = '';
			modalText.innerHTML = 'No flights in this direction.';
			modalWindow.style.display = "block";
			console.error('Error', error);
		});
	} else {
		cheapestTicket.textContent = '';
		otherCheapTickets.textContent = '';
		modalText.innerHTML = 'Enter the correct city name!';
		modalWindow.style.display = "block";
	}
});

window.addEventListener('click', () => {
	dropdownCitiesFrom.textContent = '';
	dropdownCitiesTo.textContent = '';
	if (event.target === modalWindow) {
		modalWindow.style.display = "none";
	 } 
});
modalClose.addEventListener('click', () => {
	modalWindow.style.display = "none";
 });

//functions call
getData(proxy + citiesApi, (data) => {
	city = JSON.parse(data).filter((item) => item.name);

	city.sort((a, b) => {
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		return 0;
	});
});