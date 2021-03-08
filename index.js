//**********
//DOM GRABS
//**********
const input = document.querySelector('input');
const searchButton = document.querySelector('.header-search--input');
const showAllButton = document.querySelector('.header-search--show');
const headerButtons = document.querySelector('.header-search');
const resultsBox = document.querySelector('.results-box');
const pokeWrapper = document.querySelector('.pokemon-wrapper');

const footer = document.querySelector('footer');


//***************
//MAIN FUNCTIONS
//***************
const debounce = (func)=>{
  let timeoutID;
  return (eventArg)=>{
    if(timeoutID){
      clearTimeout(timeoutID);
    }
    timeoutID = setTimeout(()=>{
      func(eventArg); 
    },800)
  }
}

const fetchData = async ()=>{
  const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=151');
  return response.data.results;
}


const masterData = async ()=>{
  const fetchedData = await fetchData();
  const promiseArr = await Promise.allSettled(fetchedData.map((item)=>{
    return axios.get(item.url);
  }));

  const spriteUrlArray = promiseArr.map((item)=>{
    if(item.status === "rejected"){
      return 'pokemon-error.png'
    }
    return item.value.data.sprites.other['official-artwork'].front_default;
  });

  fetchedData.forEach((item, index)=>{
    item.sprite = spriteUrlArray[index];
  });

  return fetchedData;
}


const onInput = async (event)=>{
  const searchArr = await masterData();
  const searchTerm = event.target.value.toLowerCase();
  if(!event.target.value){
    resultsBox.innerHTML = ``;
    return
  };
  resultsBox.innerHTML = ``;

  const searchResults = searchArr.filter((el)=>{
    return el.name.includes(searchTerm);
  });
  renderResults(searchResults, resultsBox);
  
}


async function renderResults(arr, target){
  for (let el of arr){
    const option = document.createElement('div');
    option.innerHTML = `
    <a>${el.name[0].toUpperCase() + el.name.slice(1)}</a>
    <img src="${el.sprite}">
    `;
    target.appendChild(option);
    option.classList.add('results-item');
    option.addEventListener('click', async ()=>{
      setTimeout(()=>{
        onSelect(el);
      },200);
    });

  }
  if(arr.length > 0){
    resultsBox.scrollIntoView({behavior:'smooth'});
  }
};

//on target select
const onSelect = async (data)=>{
  pokeWrapper.classList.add('pokemon-view');
  
  try {
    pokeWrapper.classList.add('pokemon-focus');
    const pokeData = await axios.get(data.url);
    const speciesData = await axios.get(pokeData.data.species.url);
    setTimeout(()=>{
      renderPokemonObject(createPokeObj(pokeData,speciesData));
    },210);
  }
  catch(e){
    setTimeout(()=>{
      renderPokemonObject(createBrokemonObj(e));
    },210) 
  }
  setTimeout(()=>{
    pokeWrapper.classList.remove('pokemon-view');
  },220);
}


function createPokeObj(main,species){
  //destructure what I can from the API data
  const {height,weight,
    sprites:{other:{['official-artwork']:{front_default: sprite}}}} = main.data;
  //pull what nested data I need to stay in arrays, remove any bulk
  const types = main.data.types.map((el)=>{return el.type.name.toUpperCase()});
  const stats = main.data.stats.map((el)=>{
    return {name:el.stat.name,value:el.base_stat};
  });
  //nested data that needs more verbose methods of extraction
  const genus = ()=>{
    for(let el of species.data.genera){
      if(el.language.name === "en"){
        return el.genus;
      }
    }
  };
  const textDescription = ()=>{
    for(let el of species.data.flavor_text_entries){
      if(el.language.name === "en" && el.version.name === "emerald"){
        return el.flavor_text;
      }
    }
  }
  //the returned pokemon object
  return {
    id: numberPadding(main.data.id),
    name: main.data.name[0].toUpperCase() + main.data.name.slice(1),
    height,
    weight,
    sprite,
    types,
    stats,
    genus: genus(),
    text: textDescription()
  };
}

//dummy object for when cloudflare is playing up
function createBrokemonObj(e){
  return {
    id: 404,
    name: 'error',
    height: 0,
    weight: 0,
    sprite: 'pokemon-error.png',
    types: ['electric'],
    stats:  [{name:'usefulness',value:0}],
    genus: 'Disappointing Pokémon',
    text: e
  };
}


const renderPokemonObject = (obj)=>{
  pokeWrapper.innerHTML = '';

  const pokemonButton = createPokeElement('a', 'pokemon-wrapper__icon', pokeWrapper);
  pokemonButton.innerHTML = '<ion-icon name="close"></ion-icon>'
  pokemonButton.addEventListener('click', ()=>{
    for(classEL of pokeWrapper.classList){
      if(classEL === 'pokemon-focus'){
        
        pokeWrapper.classList.add('pokemon-view');
        setTimeout(()=>{
          pokeWrapper.innerHTML = '';
          pokeWrapper.classList.remove('pokemon-focus');
        },200);
      }
    };
  });
  
  const pokemonSprite = createPokeElement('div', 'pokemon__sprite', pokeWrapper);
  pokemonSprite.innerHTML = `<img src="${obj.sprite}">`;

  const pokemonInfo = createPokeElement('div', 'pokemon__info', pokeWrapper);
  const pokemonInfoPrimary = createPokeElement('div', 'pokemon__info__primary', pokemonInfo);
  pokemonInfoPrimary.innerHTML = `
    <p class="pokemon__info__primary__id-name">${obj.id} ${obj.name}</p>
    <p class="pokemon__info__primary__genus">${obj.genus}</p>
  `;

  const pokemonInfoType = createPokeElement('div', 'pokemon__info__type', pokemonInfo);
  for(let type of obj.types){
    const el = document.createElement('p');
    el.style.backgroundColor = typeColor(type);
    el.innerText = `${type}`;
    pokemonInfoType.appendChild(el);
  }

  const pokemonMeasurements = createPokeElement('div', 'pokemon__info__measurements', pokemonInfo);
  pokemonMeasurements.innerHTML = `
    <p class="pokemon__info__measurements__height">Height: ${obj.height/10} m</p>
    <p class="pokemon__info__measurements__weight">Weight: ${obj.weight/10} kg</p>
  `;

  const pokemonStats = createPokeElement('div', 'pokemon__stats', pokeWrapper);
  for(let stat of obj.stats){
    if(stat.name.includes('-')){
      let strArr = stat.name.split('-');
      strArr[0] = `${strArr[0].slice(0,2).toUpperCase()}`;
      stat.name = strArr.join('-');
    }
    const statWrapper = createPokeElement('div', 'pokemon__stats__wrapper', pokemonStats);
    statWrapper.innerHTML = `<h4>${stat.name}: ${stat.value}</h4>`;
    const statBarFull = createPokeElement('div', 'pokemon__stats__wrapper__outer', statWrapper);
    const statValue = createPokeElement('div', 'pokemon__stats__wrapper__inner', statBarFull);
    statValue.style.width = `${(stat.value / 255)*100}%`;
  }

  const pokemonText = createPokeElement('div', 'pokemon__text', pokeWrapper);
  pokemonText.innerHTML = `<p>${obj.text}</p>`;
}



//*****************
//HELPER FUNCTIONS
//*****************
const typeColor = (pokeType)=>{
  switch (pokeType.toLowerCase()){

    case 'normal': return '#A8A878';
    case 'fire': return '#F08030';
    case 'water': return '#6890F0';
    case 'grass': return '#78C850';
    case 'electric': return '#F8D030';
    case 'ice': return '#98D8D8';
    case 'fighting': return '#C03028';
    case 'poison': return '#A040A0';
    case 'ground': return '#E0C068';
    case 'flying': return '#A890F0';
    case 'psychic': return '#F85888';
    case 'bug': return '#A8B820';
    case 'rock': return '#B8A038';
    case 'ghost': return '#705898';
    case 'dark': return '#705848';
    case 'dragon': return '#7038F8';
    case 'steel': return '#787887';
    case 'fairy': return '#EE99AC';
    default: return 'black';
  }
}

//to make renderPokemonObject() less verbose
const createPokeElement = (element, className, parentNode)=>{
  const temp = document.createElement(element);
  temp.classList.add(className);
  parentNode.appendChild(temp);
  return temp;
}


const numberPadding = (val)=>{
  let str = val.toString();
  return str.padStart(3, '0');
}


//****************
//EVENT LISTENERS
//****************
input.addEventListener('input', debounce(onInput));


searchButton.addEventListener('click', ()=>{
  resultsBox.innerHTML = ``;
  input.value = '';
  searchButton.classList.add('search-click');
  showAllButton.classList.add('search-click');
  input.classList.add('searchbar-focus');
});

showAllButton.addEventListener('click', async ()=>{
  resultsBox.innerHTML = ``;
  const allResults = await masterData();
  renderResults(allResults, resultsBox)
  resultsBox.scrollIntoView({behavior:'smooth'});
})

document.addEventListener('click',(event)=>{
  if( !headerButtons.contains(event.target) &&
      !input.contains(event.target) && 
      !resultsBox.contains(event.target) && 
      !pokeWrapper.contains(event.target) && 
      !showAllButton.contains(event.target) &&
      !footer.contains(event.target)
      ){
  
    for(classEL of pokeWrapper.classList){
      if(classEL === 'pokemon-focus'){
        
        pokeWrapper.classList.add('pokemon-view');
        setTimeout(()=>{
          pokeWrapper.innerHTML = '';
          pokeWrapper.classList.remove('pokemon-focus');
        },200);
        return;
      }
    };
    document.body.scrollIntoView({behavior:'smooth'});
    resultsBox.classList.add('add-opacity');
    setTimeout(()=>{
      searchButton.classList.remove('search-click');
      showAllButton.classList.remove('search-click');
      input.classList.remove('searchbar-focus');
      resultsBox.innerHTML = ``;
      resultsBox.classList.remove('add-opacity');
    },400);
    
  }
});

