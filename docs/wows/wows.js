function Extra (){
        this.open = 21;//valeur a l'ouverture
    this.close = 22;//valeur a la cloture precedente
    this.volume = 23;//volume d'echange
    this.avgVolume=34;//volume d'echange moyen
    this.capitalisation = 45;//capitalisation boursiere
    this.gain = 23;//gain de l'action depuis sa mise en bourse
    
    this.copyFromJSON = function(infos){
            this.open = infos.Op;
            this.close = infos.Pp;
            this.volume = infos.V;
            this.avgVolume=infos.avgV;
            this.capitalisation = infos.Mc;
            this.gain = infos.Pe;
    }
}
function StockData (){
        this.name = null;
        this.code = null;
        this.place = null;
        this.market = null;
        this.value = null;
        this.gain = null;
        this.pgain = null;
        this.amplitude = null;
        
        this.charts = null;
        this.extra = new Extra();
        
        this.copyFromJSON = function(data, charts){
                this.name = data.FrNm;
                this.code = data.FlIns;
                this.place = data.EExNm;
                this.market = data.market;
                this.value = data.Lp;
                this.pgain = data.Chp;
                this.gain = data.Ch;
                this.amplitude = [data.Yl,data.Yh];
                console.log(data);
                this.charts = charts;//les valeurs dans le temps
                this.extra.copyFromJSON(data);
        }
}


wowsContext = {
    app_name: "Wolf of WallStreet",
    
    _search_txt:null, // le nom de l'entreprise a rechercher
    suggestList:null, //les resultats de la recherche
    
    stock : new StockData(),//le stock a afficher
    _time : "1Y",
    
    loading: false, //pour le widget de chargement
};
Object.defineProperty(wowsContext,"search_txt",{
    get: function(){return this._search_txt;},
    set: function(value){
        if (value == null || value.trim() == "") throw "Recherche invalide: merci d'entrer quelquechose a rechercher...";
        this._search_txt = value;
        this.load_suggestions (this._search_txt);
    }
});
Object.defineProperty(wowsContext,"time",{
        get: function(){return this._time;},
        set: function(value){
                this._time=value;
                //recharge les données de cotation
                if(this.stock.code!=null) this.selectNewStock(null, this.stock.code);

        }
});
wowsContext.load_suggestions = function(search){
    if (xhr_delay != null) clearTimeout(xhr_delay);//annule

        var url = "http://finance.services.appex.bing.com/Market.svc/MTAutocomplete?q="
        +search
        +"&locale=FR-FR&count=8";
        //chargement des données avec un delay

        xhr_delay = setTimeout(function(){
                clearInterval(xhr_delay);
                xhr_delay = null;//fin de l'attente
                console.log("send xhr request:"+url);
                __load_async_json(url,"show_suggestions", error_loading, timeout_error);
        }, 300);//attends 30ms avant de lancer la requete, au cas ou
        //ajoute des lettres
};
wowsContext.show_suggestions = function(datas){
        
        
        if (datas.count>0){
                
                this.suggestList = datas.data;
                
        } else {
                this.suggestList = [];
        }
                
};
//selection du stock a afficher
wowsContext.selectNewStock = function(evt, id){
        if (id != undefined){
                //indique que lance le chargement
                this.loading = true;
	url = "http://finance.services.appex.bing.com/Market.svc/M-TodayEquityV4?rtSymbols="
	+id
	+"&chartSymbols="+id
	+"&chartType="+this._time+"&lang=FR-FR&localizeFor=FR-FR";
	  //chargement des données
	  setTimeout(function(){__load_async_json (url,"copy_stock_details", error_loading, timeout_error )},1000);
        }
}
//recupere et affiche les infos du stock
wowsContext.copy_stock_details = function(data){
        obj = data.Rtd[0];
        this.stock.copyFromJSON(obj, data.Charts[0].Series);
        
        //fin de chargement
        this.loading = false;
}

var xhr_timeout = 4000;//4 secondes avant annulation de la requete XHR
var xhr_delay = null;//permet d'eviter d'envoyer requete sur requete au serveur...

//charge les données d'une URL via XHR
function __load_async_json( url, handler, error_handler, timeout){
        console.log("ici");
          var xhr = new XMLHttpRequest();
          xhr.onload = function(e){
                  
            if(xhr.status !== 200) {
              //erreur
              if (error_handler) error_handler(xhr.responseText);
              else alert("error loading JSON file");
              return;
                }
            json_datas = xhr.response;
            datas = JSON.parse(json_datas);

            //juste pour pouvoir avoir un 'this' qui veut dire quelquechose....
            wowsContext[handler](datas);
          }
          if (error_handler){
            xhr.onerror = error_handler;
          }
          if(timeout){
                xhr.timeout = xhr_timeout;
                xhr.ontimeout = timeout;
          }

          xhr.open('GET', url);
          xhr.send();
};
error_loading = function(err){
	
        this.suggestList = [err];
};
timeout_error = function(err){
	this.suggestList = [err];
};



//les converters necessaires
function localize(value, after_dot_count){
  //remplace le point par une virgule
  if (value == null) return "";
  after = after_dot_count || 2;
  return  value.toLocaleString("fr-FR",{maximumFractionDigits:after, minimumFractionDigits:after});

}

function signToColor(value){
    //si negatif, rajoute la classe red
    if(value < 0) return "negatif";
    else return "positif";
}
function linearise(value, plage){
    //linearize le tableau de données pour dessiner les courbes
    //comme svg travaille avec des objets particuliers
    //on passe par les attributs et on laisse faire le navigateur
    if(value == null || value ==undefined) return "";
	total = value.length;
    
    if (plage == null || plage[0]==null || plage[1]==null) plage=[0,100];
	step_x = (100 / total);
	step_y = 100 /(plage[1]-plage[0])

	dts = "";
	for (i=0; i < total; i++){
		//converti en %

		v = step_y * (plage[1]-value[i].P );
		x = step_x * i;
                
		dts+= x+","+v+" ";
	}

	return  "0,100 "+dts+"100,100";
}
function toReferences (value){
    //renvois les valeurs a 20, 40, 60 et 80% de la hauteur, suivant l'amplitude a 52 semaines (ie: valeurs
    // a 0%=Yl et 100%=Yh
    //sous la forme: i: le pourcentage de la hauteur, v: la valeur a cette hauteur
    if (value == null) return null;

    total = value[1]-value[0];
    min = value[0]
    //les 4 indexs qui nous interresse...

    v= [ {i:'80',v:min+(total*0.2)},{i:'60',v:min+(total*0.4)},{i:'40',v:min+(total*0.6)},{i:'20',v:min+(total*0.8)} ];

    return v;
}

function is_loading(value){
        console.log("is loading");
        return value ? "spinner" : "no_spinner";
}

