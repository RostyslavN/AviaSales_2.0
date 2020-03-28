// получаємо елементи зі сторінки
const formSearch = document.querySelector('.form-search'),
	inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
	dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
	inputCitiesTo = formSearch.querySelector('.input__cities-to'),
	dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
	inputDateDepart = formSearch.querySelector('.input__date-depart'),
	cheapestTicket = document.getElementById('cheapest-ticket'),
	otherCheapTickets = document.getElementById('other-cheap-tickets');

//дані:
//const citiesApi = 'http://api.travelpayouts.com/data/en/cities.json',
//const citiesApi = 'http://api.travelpayouts.com/data/ru/cities.json',
const citiesApi = 'dataBase/cities(en).json',
// const citiesApi = 'dataBase/cities(ru).json',
	proxy = 'https://cors-anywhere.herokuapp.com/',
	API_KEY = 'fb83fbb51ec78362a1f00aafeb7e5439',
	calendar = 'http://min-prices.aviasales.ru/calendar_preload',
	MAX_COUNT = 5;

let city = [];

//функції
const getData = (url, callback, reject = console.error) => {
	const request = new XMLHttpRequest();						//створюємо об'єкт для запиту на основі XmlHttpRequest
	request.open('GET', url);										//налаштовуємо запит, який в нас запит буде і куда відправляємо

	request.addEventListener('readystatechange', () => {	//readystatechange відслідковує зміну статусу, щоб не пропустити момент коли до нас прийде відповідь
		if (request.readyState !== 4) return;

		if (request.status === 200) {								//перевіряємо відповідь статуса від сервера
			callback(request.response);							//в разі true виконуємо callback ф-ю
		} else {
			reject(request.status);						//у випадку false виводимо в консоль помилку
		}
	});
	request.send(); // відправляємо запит
};

const showCity = (input, list) => {
	list.textContent = '';																//очищаємо список перед створенням нового

	if (input.value === '') return;													//якщо input пустий не створюємо список
	const filterCity = city.filter((item) => {			//перебираємо кожне місто і співставляємо з тим, що написав користувач
		const fixItem = item.name.toLowerCase(); 							//всі міста переводимо в нихній регістр
		return fixItem.startsWith(input.value.toLowerCase());			//перевіряємо чи є місто з символами введеними в input
	})

	filterCity.forEach((item) => {												//для міст, що були відібрані
		const li = document.createElement('li');								//ствоюємо li
		li.classList.add('dropdown__city');										//додаємо клас до li
		li.textContent = item.name;												//записуємо в це li відібране місто
		list.append(li);
	})
};

const selectCity = (event, input, list) => {
	const target = event.target;
	if (target.tagName.toLowerCase() !== 'li') return;							//якщо клік відбувся не по li зупиняємо ф-ію
	input.value = target.textContent;												//заповнюємо вказаний input текстом в li
	list.textContent = '';																//очищаємо вказаний list після виконання ф-ії
};

const getNameCity = (code) => {											//ф-я для отримання назви міста через код міста
	const objCity = city.find((item) => item.code === code);		//перебираємо кожне місто, і порівнюємо його код з переданим кодом, передаємо в objCity
	return objCity.name;														//отримуємо з цього об'єкта name і повертаємо
};

const getDate = (date) => {												//ф-я створює дату у вказаному форматі
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
		return num === 1 ? 'З одною пересадкою' : 'З двома пересадками';
	} else {
		return 'Без пересадок';
	}
};

const getLinkAviasales = (data) => {						//створюємо посилання для перегляду квитків по кнопці "Знайти білети"
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

const createCard = (data) => {										//ф-я створює карточку з інфою про квиток
	const ticket = document.createElement('article');			//стврюємо тег artickle
	ticket.classList.add('ticket');									//додаємо до нього клас

	let deep = '';
	if (data) {																//якщо квиток існує створюємо карточку
		deep = `
			<h3 class="agent">${data.gate}</h3>
			<div class="ticket__wrapper">
				<div class="left-side">
					<a href="${getLinkAviasales(data)}" target="_blank" class="button button__buy">Купити
						за ${data.value}₽</a>
				</div>
				<div class="right-side">
					<div class="block-left">
						<div class="city__from">Виліт з міста
							<span class="city__name">${getNameCity(data.origin)}</span>
						</div>
						<div class="date">${getDate(data.depart_date)}</div>
					</div>
		
					<div class="block-right">
						<div class="changes">${getChanges(data.number_of_chages)}</div>
						<div class="city__to">Місто призначення:
							<span class="city__name">${getNameCity(data.destination)}</span>
						</div>
					</div>
				</div>
			</div>
		`;
	} else {
		deep = '<h3>На жаль, на поточну дату білетів не знайшлось.</h3>'
	}
	ticket.insertAdjacentHTML('afterbegin', deep);								//вставляємо верстку в html
	return ticket;
};

const renderCheapDay = (cheapTicket) => {										//створює карточку з квитком і вставляє в секцію cheapestTicket
	cheapestTicket.innerHTML = '<h2>Найдешевші білети на цю дату</h2>';

	const ticket =  createCard(cheapTicket[0]);
	cheapestTicket.append(ticket);
};

const renderCheapYear = (cheapTickets) => {
	otherCheapTickets.innerHTML = '<h2>Найдешевші білети на інші дати</h2> ';
	cheapTickets.sort((a, b) => {													//сортування за датою виліту (сортування працює і з числами, і з стрічками)
		if (a.depart_date > b.depart_date) {
			return 1;
		}
		if (a.depart_date < b.depart_date) {
			return -1;
		}
		return 0;
	});
	//cheapTickets.sort((a, b) => a.value - b.value);						//сортування за ціною, таке сортування спрацює тільки з числами
	
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

//обробники подій
inputCitiesFrom.addEventListener('input', () => {								// додаємо слідкування на введення символа в inputCitiesFrom і запускаємо ф-ію
	showCity(inputCitiesFrom, dropdownCitiesFrom)								//не можна зразу викликати ф-ію showCity, бо вона викличеться на першій стадії інтерпретації
});

dropdownCitiesFrom.addEventListener('click', (event) => {
	selectCity(event, inputCitiesFrom, dropdownCitiesFrom)
});

inputCitiesTo.addEventListener('input', () => {								// додаємо слідкування на введення символа в inputCitiesFrom і запускаємо ф-ію
	showCity(inputCitiesTo, dropdownCitiesTo)								//не можна зразу викликати ф-ію showCity, бо вона викличеться на першій стадії інтерпретації
});

dropdownCitiesTo.addEventListener('click', (event) => {
	selectCity(event, inputCitiesTo, dropdownCitiesTo)
});

formSearch.addEventListener('submit', (event) => {	//при submit (відправка) fromSearch
	event.preventDefault();										// прибираємо перезавантаження сторінки
	const formData = {
		from: city.find(item => inputCitiesFrom.value === item.name), //порівнюємо введені дані з назвою міста і повертаємо зайдене ОДНЕ значення !filter повернув би массив
		to: city.find(item => inputCitiesTo.value === item.name),
		when: inputDateDepart.value,
	}

	if (formData.from && formData.to) {
		const requestData = `?origin=${formData.from.code}&destination=${formData.to.code}&depart_date=${formData.when}&one_way=true`;

		getData(calendar + requestData, (response) => { 			// отримуємо дані з сервера про білет на вказані користувачем дані
			renderCheap(response, formData.when);
		}, error => {
			alert('В цьому напрямку немає рейсів.');
			console.error('Помилка', error);
		});
	} else {
		alert('Введіть коректну назву міста!')
	}
});

//виклики функцій
getData(/*proxy + */citiesApi, (data) => {
	city = JSON.parse(data).filter((item) => item.name);

	city.sort((a, b) => {													//сортування виведених міст по алфавіту
		if (a.name > b.name) {
			return 1;
		}
		if (a.name < b.name) {
			return -1;
		}
		return 0;
	});
});