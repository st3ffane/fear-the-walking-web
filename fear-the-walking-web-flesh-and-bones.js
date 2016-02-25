/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones

  
  version 0.4:
        - bug WoWs et EDGE!!!  SVG ne possede pas d'attribut Children... 
        - definition méthodes par prototype  => permet d'eviter la cr&ation de closures inutiles
  version 0.5:
        - webservice binding
  version 1.0:
        - optimisations
        - memoire/fuite

*/

var CONTEXT = null;                //data context de l'application/page web
var BINDINGS = [];//dictionnaire associant clé de binding a liste d'elements a prevenir
var MODELS = {};				   //des binding models a ajouter/supprimer des pages


//utilitaires ----------------------------------------------------------------------------------------

/*
Genere un id unique pour chaque objet a lier
*/
var __uuid_date = null;
function generateUUID() {
    __uuid_date = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, __replace_uuid);
    return uuid;
};
function __replace_uuid(c){
        var d = __uuid_date;
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
}

/*
Recupere le path vers l'element visé
	@param elem: l'element html visé
	@param root: l'element root a partir duquel cherché
	@return path: le chemin d'acces a l'element, style CSS selector
*/
function getDomPath(elem, root) {

	//si root = null, a partir de la racine
	var el = elem;
	if (!el) {
		return;
	}


          var stack = [];

          while (el != root && el.parentNode != null) {
            //si a un id, utilise le

                if ( el.hasAttribute('id') && el.id != '' ) {
              stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
            } else {
		////("searching sibling");
		var sibCount = 0;//nbr de siblings (de meme nom de tag)
		var sibIndex = 0;//index de l'element parmis les siblings
		var nodeName = el.nodeName;
		for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
		  var sib = el.parentNode.childNodes[i];
		  if ( sib.nodeName == nodeName ) {
			if ( sib === el ) {
			  sibIndex = sibCount;
			  break;
			}
			sibCount++;
		  }
		}


		if ( sibIndex >0 ) {
		  stack.unshift(nodeName + ':nth-of-type(' + (sibIndex+1) + ')');
		} else {
		  stack.unshift(nodeName);
		}

    }
	el = el.parentNode;

  }
//(stack);
  return stack.join(' > ');
}


//une méthode converter pour les radiois values
function check_radio_value(value, params){
        return value ? value == params : null;
}






//surcharge qqs methodes de array pour etr prevenu des push, slice...
var DBArray = Object.create(Array);

//DBArray.__proto__ = new Array();
DBArray.push = function(){

    //ajoute a l'array
    Array.prototype.push.apply(this,arguments);
    if(this.__owners__){
        //previens les owners
        var extra = {action:'PUSH', value: arguments.length};//le nombre de datas ajoutés: voir plus tard...
        
        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged){
                //DOIT INFORMER DE CE QU'IL DOIT FAIRE: ie AJOUT A LA FIN
                ow[0].notifyDatasetChanged(ow[1],extra);
            }
        }
    }

};
DBArray.splice = function(){
    //ajoute ET supprime
    Array.prototype.splice.apply(this,arguments);
    extra = {action:"SPLICE",index:arguments[0], howmany:arguments[1], count:arguments.length - 2}
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1],extra);
        }
    }
};
DBArray.pop = function(){
    //supprime le dernier element de la liste
    var p = Array.prototype.pop(this,arguments);
    
    if(this.__owners__){
        var extra = {action:'POP'};
        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
    return p;
};
DBArray.shift = function(){
    //retire le premier elemnt du tableau
    p = Array.prototype.shift.apply(this,arguments);
    extra = {action:'SHIFT'}
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1],extra);
        }
    }
    return p;
};
DBArray.unshift = function(){
    //ajoute un ou plusieurs element au tableau en debut
    p = Array.prototype.unshift.apply(this,arguments);
    extra = {action:'UNSHIFT', value: arguments.length};//le nombre de datas ajoutés: voir plus tard...

    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
    return p;//la nouvelle longueur du tableau
};
//overribe bracket setter? voir avec les proxies
DBArray.set = function (obj, index){
    //modifie l'item a l'index
    //NOTE: on pourrai creer des property pour chaque element de l'array
    //mais si il y en a beaucoup????
    old = this[index].__uuid__;

    this[index] = obj;
    extra = {action:'SET', index: index};//uuid de l'objet a supprimer...

    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
}





Object._defineProperty = Object.defineProperty;
Object.defineProperty = function (cible, name, accessors){
        //doit modifier le setter pour y mettre le notify...
        
        if (accessors.set){
                setters = { get: function(){ return accessors.get.call(this)},
                    set: function(v){
                            
                            
                            accessors.set.call(this,v);
                            //met a jour les bindings....
				//passe l'UUID de l'objet pour retrouver avec la cl�
				//note, context itou?
				//notifyDatasetChanged(this.__uuid__+":"+obj_k);
                                
                                if (this.__uuid__){
                                        var key = this.__uuid__+":"+name;
                                        var bindings = BINDINGS;
                                        if (key in bindings) {
                                                __notifyDatasetChanged(this,bindings[key], key);
                                        }
                                }
                                
				
                        }
                };
                Object._defineProperty(cible, name, setters);
        }
        else {
                
                Object._defineProperty(cible, name, accessors);
        }
        
}

//permet de creer le necessaire pour la liaison de donnée  (ie: property et notify)
//@param obj: le plain object javascript a rendre 'bindable'
var defineBindObject = function(obj){
    if (obj == null) return;
    var is_array = false;

    if (obj.hasOwnProperty('__uuid__') !== true){
        if (Array.isArray(obj) && ""+Object.prototype.toString.call(obj)!="[object String]"){
            is_array = true;
        }

        else if (""+Object.prototype.toString.call(obj)!="[object Object]") {

    		return;//deja fait
    	}
    } else return;


	//cree la property de marquage
	var uuid = generateUUID();

	Object.defineProperty(obj, '__uuid__',{value:uuid , enumerable: false, writable:false});//????? avec le in, pe un probleme?
	Object.defineProperty(obj, 'notifyDatasetChanged',{value: function(name, extra){
		
				//passe l'UUID de l'objet pour retrouver avec la cl�
				//note, context itou?
				//notifyDatasetChanged(this.__uuid__+":"+obj_k);
				var key = this.__uuid__+":"+name;
                                //("search for "+key);
				if (key in BINDINGS) {
					////("OK");
                                        //("notify from setter");
					__notifyDatasetChanged(this,BINDINGS[key], key, extra);
				}
	}, enumerable: false, writable:false});
	//defini des  owners pour l'objet EXPERIMENTAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	Object.defineProperty(obj, "__owners__",{value:[], enumerable:false, modifiable:true});
	//ajoute, supprime un owners
	obj.AddToOwners = function(owner, prop_name){
		this.__owners__.push( [owner, prop_name]);//ajoute a la liste
	};
	obj.RemoveFormOwners = function(owner, prop_name){
		if (this.__owners__){
                        var owi = this.__owners__.length;
                        while(owi--){
			//for (owi=0;owi<this.__owners__.length; owi++){
				var ow = this.__owners__[owi];
				if (ow[0] == owner && ow[1]==prop_name){
					this.__owners__.slice(owi,1);//supprime
					break;//fini
				}
			}
		}
	};

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    //si array, binde de facon particuliere
    if (is_array){
        //("ArrayBinding data: particulier");
        obj.__proto__ = DBArray;//change le prototype!

        return;
    }
    else {
        //un objet normal, binde les property
        /*var keys = Object.keys(obj);
        var key_count = keys.length;*/
        //while (key_count--){
        for (obj_k in obj){
        //        var obj_k = keys[key_count];
    		if (typeof obj[obj_k] == "function" || obj_k.substr(0,1) == '_')continue;
                

    		//cree le binding, ie, cree une nouvelle property pour l'objet
    		//non enumerable
                var old = obj[obj_k];

    		Object.defineProperty(obj, "__"+obj_k,{
    			value : obj[obj_k],
    			enumerable:false,
    			writable:true
    		});

    		//change la property pour mettre en place le notifydatasetchanged
    		//cree une cl� de la forme className_propName

    		//probleme prop_key change, probleme closure
    		__define_property(obj, obj_k);

			//(obj);

           //Si une valeur, binde la valeur
            if(obj[obj_k]!= undefined){
			//("binding de "+obj_k);
                defineBindObject(obj[obj_k]);
                if (obj[obj_k]!= undefined && obj[obj_k].AddToOwners)  obj[obj_k].AddToOwners(obj, obj_k);
            }
    	}
    }


}




//definie une property pour un objet a lier
//INTERNAL
//@param obj: l'instance de l'objet a lier
//@param obj_k: nom de la property a lier
function __define_property(obj, obj_k){
	Object.defineProperty(obj,obj_k,{
			get : function(){
				return this["__"+obj_k];
			},
			set : function(value){

                                //experimental !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                                var old = this["__"+obj_k];
                                if (value != null ) defineBindObject(value);


                                if (old != null && old.RemoveFromOwners) old.RemoveFromOwners(this,obj_k);
                                if (value!= null && value.AddToOwners) value.AddToOwners(this, obj_k);
                                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

				this["__"+obj_k] = value;
			}
		});
}

//modifie un peu le html pour gerer les listes d'events
HTMLElement.prototype._addEventListener = HTMLElement.prototype.addEventListener
//Ajoute un ecouteur d'event a l'element html
//@param a: le nom de l'event a ecouter (ex: load, change...)
//@param b: la methode a executer
HTMLElement.prototype.addEventListener = function(a,b) {
    //("adding event listener to "+a);
    //(this);
    this._addEventListener(a,b);//event, function

	if(!this.eventListenerList) this.eventListenerList = {};
	if(!this.eventListenerList[a]) this.eventListenerList[a] = [];
	this.eventListenerList[a].push(b);
};

HTMLElement.prototype._removeChild = HTMLElement.prototype.removeChild;
//supprime un element, en profite pour supprimer les ecouteurs d'events
//@param child: l'element enfant a supprimer
HTMLElement.prototype.removeChild = function(child){

	this._removeChild(child);
    //("removing child ");
	clear_events(child);
}
//supprime les ecouteurs d'events des elements html
//@param child: l'element a qui supprimer les ecouteurs (lui et ses enfants)
function clear_events (child){
    //uniqument pour lui ou aussi pour les inners????
	if(child.eventListenerList){
                //("supprime les events listeners");
                var events = null;
                var j=0;
		for (key in child.eventListenerList){
				events = child.eventListenerList[key];
                                j = events.length;
                                while (j--){
				//for(j=0;j<events.length; j++){
					child.removeEventListener(key,events[j] );
                                        
                                        if(child._input_binding)child._input_binding=null;
                                        if(child._cmd_binding)child._cmd_binding=null;
				}
			}
	}
	if(child.children){
		//parcours les elements pour virer les events
                var elem = null;
                var ci = child.children.length;
                while(ci--){
		//for(var ci=0;ci < child.children.length;ci++){
			elem = child.children[ci];
			clear_events(elem);
		}

	}
}

/*le binding par defaut, remplace les donn�es de la property binder par
le nouvelle valeur
*/
function __prop_binding(infos){
    if (infos == null) return;
//initialisations pas glop, serait mieux si init a vide...
    this._path = infos.path; 			//getDomPath(this._element, infos.root);
    //this._id = infos.id;
    this.to=infos.to;					//nom de la property a binder, par defaut setValue?
    this.from = infos.from;				//nom de la datas (ou path) a binder
    //Probleme: si URL, doit creer une nouvelle propriété dans le context pour y stocker les données....
    
    
    
    this.mode = infos.mode;				//choix one_way, 2 way si input?
    this.converter = infos.converter;	//pour convertir les donn�es en ce qu'on veut
    this._converter_params = null;		//parametres pour le converter
    this._fallback = null;				//quoi afficher par defaut
    
    this.converter_params = infos.converter_params;		//des parametres optionnels pour le converter TODO
    this.fallback = infos.fallback;						//si la valeur est null (ou invalide?), ce qui doit etre afficher

        

	this.alt = infos.alt;				//liaison a d'autres property
    this.root = infos.root;				//l'element root du binding
    this._element = infos._element;		//element html a binder (peut se trouver dans un model!!!)

    this._key_uuid_ = null;				//je m'en sert encore de ca???
    
    

	
}
__prop_binding.prototype = {
        get converter_params(){return this._converter_params;},
        set converter_params(value){
                if (value==null) this._converter_params = null;
            //split la chaine en un tableau de parametres
            else if (value[0]=='[' && value[value.length-1]==']'){
                //un tableau de parametres
                value = value.substring(1, value.length-1);
                this._converter_params = [];
                vs = value.split(",");
                for (vp=0;vp<vs.length;vp++){
                    p=vs[vp];
                    this._converter_params.push(__unstringify(p));
                }
            }

            else {
            //un seul parametre...
              this._converter_params = __unstringify(value);
            }
        },
        
        get fallback(){return this._fallback;},
        set fallback(value){this._fallback = __unstringify(value);}
};

//initialisation du binding au besoin
__prop_binding.prototype.init = function (context){
        //initialisation,si webservice, crée la 
       
}
//Recupere le nom de toutes les property a sureiller pour la mise
//a jour de ce binding
//@param infos: les informations de binding
//@return array: les noms de property a surveiller (from, alts et converter_params)
__prop_binding.prototype.getBindingKeys = function(infos){

        var infos = infos || this;
        //gestion du 'alt' ------------------------------------------------
        var keys = infos.alt;
        if(keys) keys = keys.split(',');
        else keys = [];


        //si des parametres de converter, bind aussi....
        if(this.converter_params != null){
            var ci = this.converter_params.length;
            var p = null;
            while(ci--){
            //for (ci=0;ci<this.converter_params.length;ci++){
                p = this.converter_params[ci];
                if (p[0]=='$'){
                    p=p.substring(1);
                    keys.push(p);//ajoute a la liste, pas acces au context pour l'instant...
                }
            }
        }


        keys.push(infos.from);//ajoute le from qd meme!

        return keys;
    }

//met a jour le contenu du binding
//@param value: la valeur a afficher (peut etre null)
//@param context: le context de données courant
//@param extra: des parametres en plus (non utilisé pour l'instant)
__prop_binding.prototype.populate = function(value, context, extra){

		if(value == null) value = this.fallback;
		value = this.convert_value (value, context);

        this._element[this.to] = value;
        this._key_uuid_ = context.__uuid__+":"+this.from;

    }

 
//convertie la valeur passée au populate en fonction du converter et de ses
//parametres
//@param value: la valeur a convertir
//@param context: le context de données courant
//@param return: la valeur convertie
__prop_binding.prototype.convert_value=function(value, context){
        //au cas ou des params commencant par $
        
        if (this.converter!=null)
	{
            //les parametres
            //probleme, doivent suivre les modifs des parametres...
            var p = null;//pour stocker les valeurs courantes des parametres...
            var cp = null, key=null, keys = null, v = null;
            
            if(this.converter_params != null){
                    
                if (Array.isArray(this.converter_params)){
                    p = [];
                    var cpi = this.converter_params.length;
                    while(cpi--){
                    //for (cpi=0;cpi<this.converter_params.length;cpi++){
                        cp = this.converter_params[cpi];
                            
                        if (cp[0]=='$'){
                            key = cp.slice(1);

                            v = context;
                            keys = key.split('.');
                            if (keys[0] == "global") {
                                v = CONTEXT;//passe en context global
                                keys = keys.slice(1);//et supprime global de la liste
                            }
                            //k = keys.length;
                            //while(k--){
                            for (var k = 0, e=keys.length; k<e;k++){
                                k=keys[k];
                                if (k in v) v= v[k];
                                else {
                                    v = null;
                                    break;
                                }
                            }
                            p.push(v);//ajoute la valeur trouvée!

                        } else {p.push(cp);}
                    }
                } else {
                    cp = this.converter_params;
                    if (cp[0]=='$'){

                        key = cp.slice(1);

                        if(key in context){
                            p = context[key];//recupere la valeur actuelle, mais doit se tenir informé des modifs
                        }
                    }else {p=cp;}
                }
            }
		    value = window[this.converter](value,p);
		}
        return value;
    }

//@deprecated
__prop_binding.prototype.clone = function(root){
		//cree un nouveau binding li� au root element
		infos = {};
		for(k in this._infos){
			infos[k]=this._infos[k];
		}
		//autorise le process event
		infos["process_event"] = true;
		//recupere l'element html a partir du root
		////("INFOS PATH: "+this._path);
		infos._element = root.querySelector(this._path);

		////("root of element");
		////(infos._element);
		return __create_binding_from_infos(infos);

	}


        
        
        
        
        
/* un binding sur une zone de texte (en general, entre 2 balises)*/
function __textContent_binding(infos){    
    
    __prop_binding.call(this, infos);
    this._index = infos._index;		//index dans la chaine argument ou se trouve le binding
    this._length = infos._length;	//taille de la donn�e du binding (en char)


    
}

__textContent_binding.prototype = new __prop_binding( );
__textContent_binding.prototype.populate = function(value, context, extra){


        if(value == null) value = this.fallback;
	value =""+ this.convert_value (value, context);//force string



        //probleme, si binding interieur, il y a du texte...
        //pourquoi fallback pert les pedales????
        //(this)
        var dt = this._element.textContent;


        //remplace dans la string html, garde ce qu'il y a avant et apres
        var start = this._index == 0 ? "" : dt.substring(0, this._index);
        var end = dt.substring(this._index + this._length);
        //la taille de la datas (pour pouvoir modifier apres)

        this._length = value.length;
        this._element.textContent = start + value + end ;
        this._key_uuid_ = context.__uuid__+":"+this.from;
    }
/*binding d'un attribute HTML (ex: class)*/
function __attr_binding(infos){

    __prop_binding.call(this, infos);


    this._index = infos._index;		//index dans la chaine argument ou se trouve le binding
    this._length = infos._length;	//taille de la donn�e du binding (en char)
    
}
__attr_binding.prototype = new __prop_binding(  );
__attr_binding.prototype.populate = function(value, context, extra){

        //pas une property de l'element (ex: class), modifie le html
        if(value == null) value = this.fallback;
		value =""+ this.convert_value (value, context);//force string

        var dt = this._element.getAttribute("data-binded-"+this.to);
        if(dt == null){
            //ancienne facon?
            dt = this._element.getAttribute(this.to);
        }
        //remplace dans la string html, garde ce qu'il y a avant et apres
        var start = this._index == 0 ? "" : dt.substring(0, this._index);
        var end = dt.substring(this._index + this._length);

        this._element.setAttribute(this.to,start + value + end );
        this._key_uuid_ = context.__uuid__+":"+this.from;
    }

    
    
    
    
    
    /*bind un objet*/
function __model_binding(infos){
        
    if (infos == null) return;
    
    this.deep = infos.deep;   //binde les proprietes de l'objet??
    
    __prop_binding.call(this, infos);
    this.presenter = infos.presenter;	//le code html pour l'affichage des donn�es de l'objet
    this.merge = infos.merge;			//@deprecated compliqué a expliquer pour une utilisation tres reduite (voir exemple SVG)
    this.empty = infos.empty;

    //le cache pour les fallbacks, models...
    
    //les data-types
    model = document.getElementById(this.presenter);
    if (model){
           
        this._root_model = model;
        this._cache_types = {};
        
        //recupere les datas types si existent
        var children = model.children;
        if (children == null){
                children = [];
                var childs = model.childNodes;
                var end = childs.length;
                for (i= 0; i< end; i++){
                      if (childs[i].nodeType != 8 && (childs[i].nodeType != 3 || /\S/.test(childs[i].nodeValue))){
                              children.push( childs[i] );
                              break;
                      }
                }
        }
        var count = children.length;
        while (count--){
                var elem = children[count];
                var type="defaut";
                
                if (elem.hasAttribute("data-type")){
                        type = elem.getAttribute("data-type");
                } 
                //enregistre
                this._cache_types[type] = elem;
        }
        if (this.fallback) this._cache_types['fallback'] = document.getElementById(this.fallback);
        if (this.empty) this._cache_types['empty'] = document.getElementById(this.empty);
    }
    
    
}
__model_binding.prototype = new __prop_binding();
/*
//ajoute un element au stack pour pouvoir reutiliser plus tard
	//@param type: le type de donnée (nom de la fonction constructeur)
	//@param stack: l'element html a ajouter au stack
    __model_binding.prototype._stack_push=function(type, stack){
        if (this._stack[type] == null) this._stack[type]=[];
        this._stack[type].push(stack);
    };

	//recupere un element du stack pour reutilisation
	//@param type: le type d'element a recuperer (nom de la fonction constructeur)
    __model_binding.prototype._stack_obtain=function(context, type){
        //verifie toute le chaine de prototype
        //("type demandé:"+type)
        
        if (type == "fallback") {
                if (this._stack[type] != undefined && this._stack[type].length > 0) return this._stack[type].splice(0,1)[0];
                else return null;
        }
        else if(type==null || type=='undefined'){
                //pas de type demandé
                //("type par defaut");
                var type="defaut";
                if(this._stack[type]!=undefined && this._stack[type].length > 0) return this._stack[type].splice(0,1)[0];
                return null;
        }
        var proto = context.__proto__;
        //(context.constructor)
        var presenter_type = null;
        
        while (proto != null){

            presenter_type =  proto.constructor.name;
            //("Recherche stack pour:"+presenter_type)
            if(this._stack[presenter_type]!=undefined && this._stack[presenter_type].length > 0) {
                //("trouve dans le stack!!!");
                return this._stack[presenter_type].splice(0,1)[0];
            }
            //sinon, suivant
            proto = proto.__proto__;


        }
        //celui par defaut?
        //("Recherche stack pour: defaut ")
        var type="defaut";
        if(this._stack[type]!=undefined && this._stack[type].length > 0) return this._stack[type].splice(0,1)[0];
        return null;
    };

	/*
	Nettoie le html crée lors d'un precedent binding
	recupere tout et met dans un stack pour reutilisation
	*/
    __model_binding.prototype._clean = function(root){
        //var stack = {html:null, bindings:[]};
        var old_type = 'defaut';

        //("clean child");
        if (root.firstChild != null) {
                var current_keys = root.firstChild._ftw2_keys;

                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){
                    //("keys!");

                    var model_bindings = [];
                    var current = null, cr = null, index = 0, test = null;
                    
        			for (var key in current_keys){
        				//supprime de la page
        				current = current_keys[key];
                                        var bi = current.length;
                                        while(current--){
        				//for (var bi=0;bi<current.length;bi++){
        					cr = current[bi];
                                                //supprime  le context si existe
                                                if (cr.context) cr.context= null;
                                                
        					index = BINDINGS[key].indexOf(cr);

                                                test = BINDINGS[key].splice(index,1)[0];

        				    model_bindings.push(test);//supprime des bindings
                                        if(BINDINGS[key].length == 0) delete(BINDINGS[key]);


        				}

        			}
        			this._current_keys ={};//supprime?
                    //stack.bindings = model_bindings;
        		}

                //enregistre dans le stack
                //prends en compte le data_type ???
                //("ajoute au stack la clé:"+old_type)
                //this._stack_push (old_type,stack);
            //}
            root.removeChild(root.firstChild);
        }

    }

	//gestion du cas value==null
    __model_binding.prototype._process_fallback = function(){
            
        //BUG ICI!
        //("Process fallback for model");
        //si value = null, affiche et bind le fallback
        if (this.fallback == null) {
            //("look for fallback data-type");
            //regarde si a un datatype=fallback
            var p_type =  this.presenter;
            var presenter_type = p_type+"_fallback";

    		if (presenter_type in MODELS){
                        //("Fallback found!");
                        return this._populate_model(CONTEXT, p_type, "fallback", false);

    		} 


        } else {
            //affiche le fallback
            //probleme: doit pouvoir faire des bindings dedans????
            //var model = document.getElementById(this.fallback);//il peut y avoir du dtbdg dedans?
            //if (model != null){
            if (this._cache_fallback){
                //cree un nouveau model avec le fallback
                //binding du fallback: utilise le context global
                //elem = model.children[0].cloneNode(true);//fait une deep copy!
                
                return this._populate_model(CONTEXT, this.fallback, "fallback", false);
            }
            /*else {
                //this._element[this.to] = " unknown model! ";//pas de model, ne fait rien
                msg = document.createElement("h1");
                msg.appendChild(document.createTextNode("Unknown model!!!"));
                this._element.appendChild( msg);
            }*/


        }
    }

	//affiche le contenu du model
	//@param context: l'objet javascript qui servira de context de données
    //@param mroot: element HTML root du presenter (par defaut, recupere this.presenter)
    //@param type: string type de la donnée (par defaut: context.constructor.name)
    //@param deep: si doit binder les données du context (par defaut iinfos.deep)
    __model_binding.prototype._populate_model = function(context, mroot,type, deep){
        //MODIF 0.2b: bind l'objet (prototype) si necessaire
        
        
        
        
		defineBindObject(context);
        
		var model =null;//penser a ca....le var!
                //var root_model
                //supprimer cette ligne...
		//var root_model = document.getElementById(mroot || this.presenter || this.item_presenter);
        var bindings = null;


        //probleme, si heritage, doit verifier TOUTE la chaine de prototype...
        var item_type = type || context.constructor.name || "defaut";
        var p_type = mroot || this.presenter || this.item_presenter;


        //verifie si existe un stack, si oui, recupere
        var frag =null;
        var current_keys = [];//les clés crées pour ce model
        var deep_binding = deep || this.deep || true;//pour savoir si rend accessible les données internes au binding

     
            var bindings = null;
            var model = null;

            var proto = context;
            var item_type = "";


            //recherche le model
            if (type=="fallback"){
                bindings = MODELS[p_type+"_fallback"] ;
                //supprimer cette ligne
        	model = this._cache_types['fallback'];
            }
            else if(type=="empty"){
                bindings = MODELS[p_type+"_empty"] ;
                //supprimer cette ligne
        	model = this._cache_types['empty'];
            }
            else{
                while (proto != null){
                        var presenter_type = p_type+"_" + proto.constructor.name;
                        //("Recherche model pour type: "+presenter_type);
                        if (presenter_type in MODELS){

                            var item_type = proto.constructor.name;
                            //("model trouvé! "+item_type);
                                bindings = MODELS[presenter_type] ;
                                //supprimer cette ligne...
                                model = this._cache_types[item_type];//root_model.querySelector("[data-type='"+item_type+"']");
                            break;
                                }
                        //sinon, suivant
                        proto = proto.__proto__;


                    }
            }
            
            if (model == null){
                //celui par defaut
                //("Model par defaut "+p_type);
                //(root_model)
                //(MODELS)
                item_type = "defaut";
                //(MODELS)
                bindings = MODELS[p_type] ;
                
                /*var children = root_model.children;
                if (children == null){
                        children = [];
                        var childs = root_model.childNodes;
                        var end = childs.length;
                        for (i= 0; i< end; i++){
                              if (childs[i].nodeType != 8 && (childs[i].nodeType != 3 || /\S/.test(childs[i].nodeValue))){
                                      children.push( childs[i] );
                                      break;
                              }
                        }
                }*/
                model = this._cache_types['defaut'];
            }
            //("Creation d'un nouveau model "+p_type);




            if (model == null ){

                this._element[this.to] = " unknown model! "+context;//pas de model, ne fait rien
                return;
            }

            //fait une copie du model

    		var cpy_model = model.cloneNode(true);

            //ajoute le type de données dans le htmlelement, j'ai pas trouvé comment faire
            //autrement...

            cpy_model._ftw2_type = item_type;
                frag = cpy_model;


    		//fait une copie des bindings de se model et ajoute aux bindings de la page a apartir de la copie
        //(bindings);
        
        
            for(var key in bindings){


                var bd = [];
                var h=bindings[key].length;
                while(h--){
    			//for(h=0;h<bindings[key].length;h++){

                    //copie les infos de binding
    				var infos = {};
    				var inf = bindings[key][h];
    				for(var k in inf){
    					infos[k]=inf[k];
    				}

    				//autorise le process event
    				infos["process_event"] = true;
    				//recupere l'element html a partir du root
                                //("Tente de recuperer l'element HTML: "+infos.path);
                                //("Root:");
                                //(cpy_model);
                                
                                infos._element = cpy_model;
                                if (infos.path)	infos._element = cpy_model.querySelector(infos.path);
                                
                                //(infos._element);
                    //cree un nouveau binding
    				var clone = __create_binding_from_infos(infos);//cree le binding, passe la valeur a binder pour determiner le type

                    if (context.__uuid__ && deep_binding === true){
                        //gestion du 'alt' ------------------------------------------------
                        var keys =  this.getBindingKeys(infos);
                        var kk = keys.length;
                        while(kk--){
                        //enregistre les bindings
                        //for (kk = 0; kk<keys.length; kk++){

                            var n_key = keys[kk];

                            //si processinput, utilise UUID du contexte globale
                            var g_key =context.__uuid__+":"+n_key;
                            //("cree nouvelle clé: "+g_key);
                            if (g_key in BINDINGS){
                                //deja connu, ajoute simplement a la liste
                                BINDINGS[g_key].push(clone);
                            }
                            else {
                                //inconnu, cree une nouvelle entr�e
                                BINDINGS[g_key]= [clone] ;
                            }

                            //enregistre pour pouvoir nettoyer plus tard....
                            if (g_key in current_keys){
                                //deja connu, ajoute simplement a la liste

                                current_keys[g_key].push(clone);
                            }
                            else {
                                //inconnu, cree une nouvelle entr�e

                                current_keys[g_key]= [clone] ;
                            }


    					}
                    }

                    //enregistre le binding
                    //devrait plutot enregistrer les clés uniquement?
    				bd.push(clone);
                                clone.init(context);

    			}

                __notifyDatasetChanged(context,bd, key);
            }

       

        frag._ftw2_keys = current_keys;
        //doit retourner le fragment ET les clés créees...
        return frag;
    }
    
    
    
	
    __model_binding.prototype.populate = function(context, parent, extra){
	    //casse la methode pour arraymodel
		//nettoie si a deja qqchose
		//tout retirer d'un coup?
                
        var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;
        
        var parent = this._element.parentNode;
        
        
        var frag = this._element;
        
        var context = this.convert_value (context, parent);
        
        
        //("clean child for model");
        this._clean(frag);

        //this._current_keys ={};
        //("populating model! "+this.from);

        //nettoie le contenu, passe dans le stack pour reutilisation possible
        //besoin de connaitre le type...
        //("populate model");
        //(context);
		if (context == null ){
            //modif, utilise le fallback comme data-type
                        //("Process fallback!");
                        frag.appendChild(this._process_fallback());


		}
                else{
                        //ajoute l'element d'un coup, pas besoin de fragment?
                        frag.appendChild(this._populate_model(context));//le html generé
                }

		
        //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
        //this._key_uuid_ = context.__uuid__+":"+this.from;
    }

    
    
/*binding d'un array*/
function __array_binding(infos){
    __model_binding.call(this, infos);


    this.presenter = infos.item_presenter;	//pour affichage de listes//MODIFS: possible d'avoir des datas type....
        this._empty = false;
        
        //le cache pour les fallbacks, models...
        
	this.merge = infos.merge;
	//sql like
	/*this.order_by = infos.order_by; 		//un nom de variables pour ordonner la liste
	this.group_by = infos.group_by;			//nom de variable pour grouper les items NON SUPPORTE POUR L'INSTANT!
	this.select_if = infos.select_if;		//nom de methode true/false pour selectionner un item

	this.ascending = infos.ascending;		//boolean ordre ascendant/decscendant
	this._current_keys = null;				//cl� de binding cr�es dans la page... */
        //les data-types
    var model = document.getElementById(this.presenter);
    if (model){
             //("Recupere les data types pour le model");
        this._root_model = model;
        this._cache_types = {};
        
        //recupere les datas types si existent
        var children = model.children;
        if (children == null){
                children = [];
                var childs = model.childNodes;
                var end = childs.length;
                for (i= 0; i< end; i++){
                      if (childs[i].nodeType != 8 && (childs[i].nodeType != 3 || /\S/.test(childs[i].nodeValue))){
                              children.push( childs[i] );
                              break;
                      }
                }
        }
        var count = children.length;
        while (count--){
                var elem = children[count];
                var type="defaut";
                
                if (elem.hasAttribute("data-type")){
                        type = elem.getAttribute("data-type");
                } 
                //enregistre
                this._cache_types[type] = elem;
        }
        if (this.fallback) this._cache_types['fallback'] = document.getElementById(this.fallback);
        if (this.empty) this._cache_types['empty'] = document.getElementById(this.empty);
    }
   
}
__array_binding.prototype = new __model_binding ();
//@deprecated
	__array_binding.prototype._clear_binding = function(bindings){
		//nettoie le binding
		for(key in bindings){

			//pour chq items de l'array
			//passe en context l'item!
			__notifyDatasetChanged(null,bindings[key], key);
		}
	}

	/*
	Nettoie le html crée lors d'un precedent binding
	recupere tout et met dans un stack pour reutilisation
	*/
    __array_binding.prototype._clean_child = function(child, root){

        //var stack = {html:null, bindings:[]};
        //var old_type = 'defaut';

        
        if (child != null) {
            
            //probleme: si model binding entré directement dans une balise...
            /*old_type = child._ftw2_type;
            if(old_type != undefined){*/
                //("ajoute au stack")
                //recupere dans le stack
                //stack.html = child;
                //old_type = "defaut";
                var current_keys = child._ftw2_keys;//chq model a ses keys!



                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){

                    var model_bindings = [];
                    for (var key in current_keys){
                        //supprime de la page
                        //("supprime: "+key);
                        current = current_keys[key];
                        for (bi=0;bi<current.length;bi++){
                            cr = current[bi];

                            index = BINDINGS[key].indexOf(cr);

                            test = BINDINGS[key].splice(index,1)[0];

                            model_bindings.push(test);//supprime des bindings
                            if(BINDINGS[key].length == 0) delete(BINDINGS[key]);

                            //supprime aussi de current_keys....                TODO
                        }

                    }
                    //this._current_keys ={};//supprime?
                    //stack.bindings = model_bindings;
                }

                //enregistre dans le stack
                //prends en compte le data_type ???
                //("adding to stack "+old_type);
                //this._stack_push (old_type,stack);
            //}

            //de toute facon, remove child!
            root.removeChild(child);
        }
    }
    __array_binding.prototype.populate = function (value, context, extra){

        //definie les actions par defaut (ie: pas d'extras)

        //recupere l'element et place le dans un fragment pour eviter les reflows

        //a partir de maintenant, travaille dans le fragment....
        var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;
        
        var parent = this._element.parentNode;
        
        
        var frag = this._element;
        
        
        fragment.appendChild(frag);//ajoute directement l'element au fragment...
        
        //si un textnode, supprime
        if (frag.firstChild && frag.firstChild.nodeType===3) frag.removeChild(frag.firstChild);
        
        
        
        
        var value = this.convert_value (value, context);

        if (value == null){
                //("value is null!");
                this._empty = true; //marque empty
                
            //si a des childs, supprime les tous
            while (frag.firstChild) {
                frag.removeChild(frag.firstChild);
            }
            
            //("a fallback?"+this.fallback);
            if (this.fallback) {
                
                //affiche le fallback
                
                    frag.appendChild(this._populate_model(CONTEXT, this.fallback, "fallback", false));
                

            }
            
            //replace l'element dans la page
            if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
            return;
        }
        //("value exist!");
        if (value.length == 0){
                  this._empty = true; //marque empty
                //("value is empty!");
            //si a des childs, supprime les tous
            while (frag.firstChild) {
                frag.removeChild(frag.firstChild);
            }
            if (this.empty ){
                //affiche le fallback
                //probleme: doit pouvoir faire des bindings dedans????
                
               

                    //cree un nouveau model avec le fallback
                    //binding du fallback: utilise le context global
                    //elem = model.children[0].cloneNode(true);//fait une deep copy!                    
                    frag.appendChild(this._populate_model(CONTEXT, this.empty, "empty", false));
                
               

            }
            //replace l'element dans la page
            if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
            return;
        }
        
        if (this._empty){
                //supprime la empty view
                while (frag.firstChild) {
                        frag.removeChild(frag.firstChild);
                    }
                this._empty = false;
                
        }

        //s_i = (this.select_if != null && this.select_if in CONTEXT) ? CONTEXT[this.select_if] : null;


        //si un extra, modifie les actions...
        if (extra != null){
            //("Extra actions:"+extra.action+": "+extra.value);
            //suivant l'action (set,push,...) agit au mieux...
            switch(extra.action){
                case 'SET':{
                    //modifie 1 seul element, ie: supprime et remet en place
                    //recherche l'element avec uuid correspondant
                    //("set client at index: "+extra.index)
                    var ci = extra.index;

                    //nettoie les elements html inutiles si besoin
                    this._clean_child(frag.children[ci], frag);
                    var item = value[ci];
                    var result = this._populate_item(item);
                    result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                    
                    var prec = ci == 0 ? frag.firstChild : frag.children[ci-1];
                    frag.insertBefore(result,prec);
                    //replace l'element dans la page
                        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    
                    return;


                }
                case 'POP':{
                    //supprime le  dernier de la listes
                    //("Hello POP!")
                    this._clean_child(frag.children[frag.children.length -1], frag);
                    //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'PUSH':{
                    //ajoute a la fin
                    var count = extra.value
                    //("Ajoute: "+count+" nouveaux elements")
                    //recupere les counts derniers elements
                    var  add_childs = [];
                    var first = value.length - count;
                    for (var c=value.length-1;c>= first; c--){add_childs.push(value[c]);}
                    for (var ci=0; ci<add_childs.length;ci++){
                        //doit etre placé???
                        var item = add_childs[ci];

                        //model binding simple????
                        var result = this._populate_item(item);
                        result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                       frag.appendChild(result);
                    }
                       //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'SHIFT':{
                    //retire le premier element
                    //("Hello shift!")
                    this._clean_child(frag.children[0],frag);
                   //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'UNSHIFT':{
                    //ajoute en debut de tableau
                    var count = extra.value
                    //recupere les counts derniers elements
                    var add_childs = [];
                    for (var c=count - 1 ;c>=0; c--){add_childs.push( value[c]);}
                    for (var ci=0; ci<add_childs.length;ci++){
                        //doit etre placé???
                        var item = add_childs[ci];

                        //model binding simple????
                        var result = this._populate_item(item);
                        result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                        frag.insertBefore(result, frag.firstChild);
                    }
                        //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'SPLICE':{
                    //supprime ET ajoute
                    
                    //("splice!!!!");
                    
                    var index=extra.index;
                    var howmany=extra.howmany;
                    var count = extra.count;
                    //(index+","+howmany+","+count);
                    //supprime
                    //ici, travaille sur tout le tableau
                    
                    for (var ci=index;ci<index+howmany;ci++)this._clean_child(frag.children[ci],frag);//par defaut, supprime tous les childs de la liste

                    

                    //si doit ajouter en position...
                    if (count != undefined && count >0){
                        var add_childs = [];
                        var prec = frag.children[index];
                        for (var c=count - 1 ;c>=0; c--){add_childs.push( value[index+c]);}
                        for (var ci=0; ci<add_childs.length;ci++){
                            //doit etre placé???
                            var item = add_childs[ci];

                            //model binding simple????
                            var result = this._populate_item(item);
                            result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                            frag.insertBefore(result, prec);
                            
                        }


                    }
                    //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;

                }
                default: break;
            }
        }

        
        

//("UPDATE ALL THE ARRAY!")
//(this._element.textContent)
        //si a anotter le binding en text
        //if (this._element.textContent != undefined) this._element.textContent = "";
        //ici, travaille sur tout le tableau
        //var removeChilds = this._element.children ;//par defaut, supprime tous les childs de la liste
        var removeChilds = frag.children ;
        if (removeChilds==null){
                removeChilds = [];
                //var childs = this._element.childNodes;
                var childs = frag.childNodes;
                var end = childs.length;
                for (i= 0; i< end; i++){
                      if (childs[i].nodeType != 8 && (childs[i].nodeType != 3 || /\S/.test(childs[i].nodeValue))){
                              removeChilds.push( childs[i] );
                              
                      }
                }
        }
       
//(this._element.childs)
        //nettoie les elements html inutiles si besoin
        
        for(var ci=removeChilds.length-1;ci>=0;ci--){
            //this._clean_child(removeChilds[ci], this._element);
            this._clean_child(removeChilds[ci], frag);
        
        }
        

        //add_childs = value;
        //ajoute les nouveaux elements
        //modifie le html
        //par defaut, ajoute tous les elements de la liste
        for (var ci=0; ci<value.length;ci++){
            //doit etre placé???
            var item = value[ci];
            //(item);
            //model binding simple????
            //("Populating item")
            //(item)
            var result = this._populate_item(item);
            //result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

            //this._element.appendChild(result);
            frag.appendChild(result);
        }
        //affichage des groupes

        this._key_uuid_ = context.__uuid__+":"+this.from;
        //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}

        /*var frag = document.createDocumentFragment();
		this.__populate_group(tmp[group], frag);

		this._element.appendChild(frag);
        this._key_uuid_ = context.__uuid__+":"+this.from;
        */

        /*elem = this._element;
        //nettoie le model si a deja qqchose ????
        //normalement, 1 seul child...
        while (elem.hasChildNodes()) {
             elem.removeChild(this._element.firstChild);
        }

        //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
        if(this._current_keys){


            for (key in this._current_keys){
                //supprime de la page
                current = this._current_keys[key];
                for (bi=0;bi<current.length;bi++){
                    cr = current[bi];

                    index = BINDINGS[key].indexOf(cr);
                    BINDINGS[key].splice(index,1);//supprime des bindings

                }

            }
            this._current_keys = null;//supprime?
        }
		this._current_keys = {};
        value = this.convert_value (value, context);

        /*recupere le model pour les items*
        */



        /*

        //mise en place: depend de ce qu'il y a a rajouter....                  TODO!!!!!!!!!!!!!!!!!
        tmp = {defaut:[]};

		//si doit modifir la liste pour l'affichage

		if (this.select_if || this.order_by || this.group_by){


			s_i = (this.select_if != null && this.select_if in CONTEXT) ? CONTEXT[this.select_if] : null;

			o_b = this.order_by;
			g_b = this.group_by;

			//pour chq item...
			for (item_i = 0; item_i<value.length; item_i++){
				item = value[item_i];
				if (s_i && s_i(item) != true) continue;//non selectionn�

				group = null;
				//choix du group
				if (g_b && g_b in item){

					g = "_"+item[g_b];
					if (g in tmp) {

						group = tmp[g];

						if (o_b){
							//cherche ou le mettre (ascendant uniquement?)
							__array_insert_order (group, item, o_b, this.ascending);
						}

					}
					else {

						//group inconnu, insert ou on peut
						tmp[g]=[item];
					}
				}
				else {

						//group inconnu, insert ou on peut
						tmp["defaut"].push(item);
					}

			}

		}
		else {
			tmp = {"defaut": value};
		}
        */

	

    };
    __array_binding.prototype._populate_item = function(context, parent, extra){
	    //casse la methode pour arraymodel
		//nettoie si a deja qqchose
		//tout retirer d'un coup?
        //context = this.convert_value (context, parent);
        
        
        
        

        //this._current_keys ={};
        //("populating model! "+this.from);

        //nettoie le contenu, passe dans le stack pour reutilisation possible
        //besoin de connaitre le type...


		if (context == null ){
            //modif, utilise le fallback comme data-type

                return this._process_fallback();
                


		}

		//ajoute l'element d'un coup, pas besoin de fragment?
        var child = this._populate_model(context);//le html generé
        
        this._key_uuid_ = context.__uuid__+":"+this.from;
        return child;
    
    }

//utilitaire: permet de trier les elements d'une liste
//@param arr: le tableau dans lequel mettre l'element
//@param item: l'element a inserer dans le tableau
//@param o_b : nom de la property de l'element a utiliser comme comparateur
//NOTE: si o_b se modifie, doit modifier l'affichage du tableau: modif getKeysBinding
function __array_insert_order (arr, item, o_b){

	for (li=0;li<arr.length;li++){
		pitem = arr[li];
		if (item[o_b] < pitem[o_b]){
			//ajoute ici
			arr.splice(li,0, item);
			return;//fini
		}
	}
	//ajoute a la fin
	arr.push(item);
}





/*binding d'une commande*/
function __command_binding(infos){

    __prop_binding.call(this, infos);

    infos.from = this.from = "COMMANDS";

    this.context = null;
    this.command = infos.command; 	//la methode du context de données global a executer
    this._cmd_parameters = null;    //des parametres pour la methode
	
    this.command_params =  infos.command_params;



    var bind = this;

	//gestion de l'event pour la commande
    /*this.__process_event =  function(evt){

        if (bind.context == null) return;
        //recupere le nom de la methode
        value = bind.command;
        if(value == null) value = bind.fallback;
        value = bind.convert_value (value, bind.context);
        params = null;
        //appel a la methode, passe les données
        if (bind.command_params!=null){
            params=[];


            for (cpi=0;cpi<bind.command_params.length;cpi++){
                if (bind.command_params[cpi][0]=="$"){
                    //recupere le nom de la prop
                    prop = bind.command_params[cpi].substr(1);

                    if (prop in bind.context) params.push(bind.context[prop]);//par valeur
                    else params.push('null');
                }
                else params.push(bind.command_params[cpi]);
            }

        }
        CONTEXT[value](evt,params);

    }*/

	
}
//le prototype...
var cb_pr = {
        get command_params(){return this._cmd_parameters;},
        set command_params(value){
                if (value==null) this._cmd_parameters = null;
            //split la chaine en un tableau de parametres
            else if (value[0]=='[' && value[value.length-1]==']'){
                //un tableau de parametres
                value = value.substring(1, value.length-2);
                this._cmd_parameters = [];
                for (p of value.split(',')){
                    this._cmd_parameters.push(p);
                }
            }

            else {
              this._cmd_parameters = [value];
            }
        }
};
cb_pr.__proto__ = new __prop_binding(  );
__command_binding.prototype =cb_pr;
//initialise la commande
	//@param ctx: le context de donnée
    __command_binding.prototype.init = function(ctx){
        this.context=ctx;
        if (this.command != null && this.to!=null){
                

            this._element.addEventListener(this.to,this.__process_event);
            this._element._cmd_binding = this;                                                                                  // memory leaks??????
        }
    };
    __command_binding.prototype.populate = function (value, context, extra){
        this.init(context);
    };

__command_binding.prototype.__process_event = function(evt){
        //comment recuperer les binding ici.....
        
        bind = this._cmd_binding;
        
        if (bind == null || bind.context == null) return;
        
        
        //recupere le nom de la methode
        value = bind.command;
        if(value == null) value = bind.fallback;
        value = bind.convert_value (value, bind.context);
        params = null;
        //appel a la methode, passe les données
        if (bind.command_params!=null){
            params=[];


            for (cpi=0;cpi<bind.command_params.length;cpi++){
                if (bind.command_params[cpi][0]=="$"){
                    //recupere le nom de la prop
                    prop = bind.command_params[cpi].substr(1);

                    if (prop in bind.context) params.push(bind.context[prop]);//par valeur
                    else params.push('null');
                }
                else params.push(bind.command_params[cpi]);
            }

        }
        CONTEXT[value](evt,params);

    
}
    
    
    
    
    
/*binding d'un element de formulaire (input?)*/
function __input_binding(infos){
	__prop_binding.call(this, infos);
	this._pass = false;					//pour firefox mobile!
        this.return_value = infos.return_value;                 //force a retourner la propriete "value" de l'input
        
        
       	this._event =infos.event == null ? 'change' : infos.event;//qd envoyer les infos de changement
	//par defaut, sur le lost focus/enter ?
	
        //dans le cas ou le binding se trouve dans la page directement, lie le context global
        if (infos.process_event){
                //("EVENT en PLACE");
                //forcement le context global
                this.init(CONTEXT);
        }
}
__input_binding.prototype=new __prop_binding( );

__input_binding.prototype.init = function(context){
                this._element.addEventListener(this._event, this.on_process_event);
                this.context = context;//enregistre le context de donn�es pour plus tard....
		//penser a nettoyer ca plus tard...
                this._element._input_binding = this;
        }
__input_binding.prototype.on_process_event = function(evt){

		//par exemple, check box doit renvoyer checked, pas value!!!
                //value = this.valueAsChecked ?  this.value : this.valueAsChecked;
                bind = this._input_binding;
                if(bind == null || bind.context == null) return;
                
                
		value = bind.return_value === true ? this.value : this[bind.to];
                //("on process event: "+value);
                if(value == null || value == undefined || value=="") {
                    this.placeholder = bind.fallback;
                    
                }
                //("PROCESS EVENT:"+value);
                
		try{
                        //("tente de mettre a jour la donnée");
			bind.mirror(value);//appel a methode mirror de l'event???
                        //("OK");
			this.setCustomValidity("");
                        
		}catch(err){
                        //("Erreur:"+err.message);
                        
			
			this.setCustomValidity(err.message);
                        
                        //note fonctionne avec un button submit!
                        if (this.form){
                                if(this.form.reportValidity){
                                        //("report validity");
                                        window.setTimeout(function(){
                                                bind._element.form.reportValidity();//doit empecher le submit normalement et afficher les messages d'erreurs...
                                                //remet la valeur????
                                                var value = bind.convert_value (bind.context[bind.from], bind.context);
                                                //("remise de la valeur en place:" +value+", "+bind.from);
                                                if(value === null || value === undefined || value==="") {
                                                        //("HELLO NULL or UNDEFINED")
                                                    
                                                    bind._element.placeholder = this.fallback;
                                                    return;
                                                }
                                                //met a jour l'UI
                                                bind._element[bind.to] = value;
                                                                
                                                //supprime le message d'erreur, probleme, doit attendre un peu...
                                                window.setTimeout(function(){
                                                                bind._element.setCustomValidity("");
                                                                //("Remise a zero de la custom validity...");
                                                        },2000);//laisse le message 1sec
                                        });
                                }
                                else {
                                        //recupere le bouton submit si existe...
                                        form = bind._element.form;
                                        
                                        for (i=form.length-1;i>=0;i--){
                                                var input = form[i];
                                                if (input.getAttribute("type")=="submit") {
                                                        window.setTimeout(function(){
                                                                input.click();
                                                                //remet la valeur par ancienne en place???
                                                                 //remet la valeur????
                                                                value = bind.convert_value (bind.context[bind.from], bind.context);
                                                                //("remise de la valeur en place:" +value+", "+bind.from);
                                                                if(value === null || value === undefined || value==="") {
                                                                        //("HELLO NULL or UNDEFINED")
                                                                    
                                                                    bind._element.placeholder = this.fallback;
                                                                    bind._element.value="";
                                                                    return;
                                                                }
                                                                //met a jour l'UI
                                                                bind._element[bind.to] = value;
                                                                
                                                                //remet le custom validity a null?
                                                                //supprime le message d'erreur, probleme, doit attendre un peu...
                                                        window.setTimeout(function(){
                                                                bind._element.setCustomValidity("");
                                                                //("Remise a zero de la custom validity...");
                                                        },2000);//laisse le message 1sec
                                                                
                                                        }, 20);
                                                        return;
                                                }
                                        }
                                       
                                }
                                
                        }
		}
	};
//met a jour la donnée javascript
//@param value: la valeur entrée par l'utilisateur
__input_binding.prototype.mirror = function(value){
		this._pass = true;
		ctx = this.context == null ? CONTEXT : this.context;
                ctx[this.from] = value;
		this._pass=false;
    }

//@deprecated
__input_binding.prototype.clean = function(){
		//supprime l'event listener
		infos._element.removeEventListener(this._event, this.on_process_event);
	}
__input_binding.prototype.populate = function(value, context, extra){
                
                //doit mettre en place les events
                //si pas deja en place!!!!!
                
                
                
                
                //("POPULATE");
		if(this._pass){ //firefox mobile! si change la value programmatiquement, lance qd meme l'event change/input
                //probleme, si passe à null, doit modifier le contenu de l'input...
                        //("pass");
			return;
		}

                
		


        //une property de l'element, modifie directement et completement
        //probleme, peut demander a utiliser un model! ---------------------------------> TODO
        //("TEST VALUE: "+value);
        

		value = this.convert_value (value, context);
                if(value === null || value === undefined || value==="") {
                        //("HELLO NULL or UNDEFINED")
                    
                    this._element.placeholder = this.fallback;
                    if (this.to == "value") this._element.value="";//laisse le placeholder
                    else    this._element[this.to]=this.fallback;
                    return;
                }
		//met a jour l'UI
		this._element[this.to] = value;
    }



var __webservice_param_regex = new RegExp(/([\w_-]+)=(\??\$\w[\w_\d]+)/g);
function __webservice_parameter(name,value){
        //suivant le cas....
        this.name = name;
        this.value = value;//le nom de la propriete
        this.important = true;//par defaut, doit etre valide
        
        if (value.startsWith("$")) this.value = value.substr(1);
        else {
                this.value = value.substr(2);
                this.important = false;
        }
}
__webservice_parameter.prototype.getParameter = function(context){
        value = context[this.value];
        //("get parameter:"+value);
        if (value == null){
                //("NULL VALUE");
                if( this.important) throw Error();
                else return this.name+"=";
        }
        
        return this.name+"="+encodeURI(value);
}
__webservice_parameter.prototype.toString = function(){return this.value;}//renvoie le  nom du parametre de binding



function __webservice_url (url){
        //recupere les infos a partir de l'URL:
        //la cibe, les parametres
        this._url =  url;
        
        this._params = [];//liste des parametres pour l'url (binding)
        this._param_str = "";//les parametres autres de l'url (sans binding)
        
        //recupere la premiere position du ? pour les parametres
        params_pos = url.indexOf("?");
        if(params_pos != -1){
                //("des parametres!!!");
                //recupere le corps de l'URL
                this._url = url.substr(0,params_pos);
                param_str = url.substr(params_pos+1);//unqiement les parametres...
                 match = __webservice_param_regex.exec(param_str);
                    if (match){
                        params = [];
                        pi = 0;
                        while (match){
                                //recupere le nom du parametre et sa valeur: nom de la propriété
                                //doit decouper l'URL???
                                str = match[0];
                                name = match[1];
                                value = match[2];
                                this._params.push(new __webservice_parameter(name, value));
                                
                                param_str = param_str.replace(str,"{"+pi+"}");
                                pi++;
                                //supprime de la chaine de parametres
                                
                                __webservice_param_regex.lastIndex = 0;//remet a zero pour leprochain coup
                                match = __webservice_param_regex.exec(param_str);
                        }
                        
                        //(param_str);
                        this._param_str = param_str;
                        
                    } else {
                            //("pas de parametres...");
                    }
        }
        
        
            //binding vers un webservice
            //parse l'url pour trouver les parametres si existent
            //rajoutent a alt!
           

}
__webservice_url.prototype.getURL = function(context){
        //cree l'url avec les données du context
        try{
                url = this._url;
                //ajoute les parametres
                if (this._param_str.length>0){
                        url+="?";
                        str = this._param_str;
                        for (upi=0;upi<this._params.length;upi++){
                                //(upi+", "+this._params[upi]);
                                v = this._params[upi].getParameter(context);
                                str = str.replace("{"+upi+"}",v);
                                //(str);
                        }
                        
                        url+= str;
                
                }
                //(url);
                return url;
        } catch(Error){ 
                //(Error);
                //("parametre obligatoire non present: annule");
                return null;}
};
__webservice_url.prototype.getParametersNames = function(){
        //renvoie la liste des parametres sous forme de string csv
        return this._params.join(",");
}


//Recuperation des datas depuis un service web (renvoyant du JSON)
//Les erreurs: timeout et loaderror

//un waitingobj:???

//l'objet AJAX lui meme 
var xhr_timeout = 4000;//4 secondes avant annulation de la requete XHR
function WEBSERVICE_LOADING (msg){ this.message = msg;}
function WEBSERVICE_ERROR (err){
        this.message=""+err;
}
function WEBSERVICE_TIMEOUT (err){
        this.message = ""+err;
}
function __load_async_datas ( url, context, prop, key){
          var xhr = new XMLHttpRequest();
          //("loading async datas from webservice....");
          //met en attente
          context[prop] = new WEBSERVICE_LOADING();
          context.notifyDatasetChanged(key,1);
                      
                      
          xhr.onload = function(e){
            //("get datas!!!");
            if(xhr.status !== 200) {
                      //erreur
                      //("erreur code:"+xhr.status);
                      context[prop] = new WEBSERVICE_ERROR(xhr.responseText);
                      context.notifyDatasetChanged(key,1);
                      return;
                }
            
            datas = xhr.response;
            
            if (datas == null){
                    context[prop] = null ;
                    context.notifyDatasetChanged(key,1);
                    return;
            }
            
            type = xhr.getResponseHeader("content-type");
            if (type.startsWith("application/json")){
                    //parse le contenu JSON
                    //quid si XML????
                    try{                                
                                datas = JSON.parse(datas);
                        } catch(Error){
                                datas  = new WEBSERVICE_ERROR("Erreur lors du parse JSON");
                        }
                        
            } else if(this.reader){
                    datas = window[this.reader](datas);
            } 
           //sinon, assume simple string?
           context[prop] = datas ;
           context.notifyDatasetChanged(key,1);
                    
          };
        
            xhr.onerror = function(err){
                    //("une erreur");
                    //(err);
                context[prop] = new WEBSERVICE_ERROR(err);
                context.notifyDatasetChanged(key,1);
            };
        
          
        xhr.timeout = xhr_timeout;
        xhr.ontimeout = function(err){
                context[prop] = new WEBSERVICE_TIMEOUT(err);
                context.notifyDatasetChanged(key,1);
        };
            
          

          xhr.open('GET', url);
          xhr.send();
}




function __webservice_model_binding (infos){
        __model_binding.call(this,infos);
        this.reader =  infos.reader;
       if (this.from.startsWith("http://")==true || this.from.startsWith("https://")==true){
            
            this._url = new __webservice_url(this.from);//recupere les infos de l'URL
            this.from = infos.as || generateUUID();//le nom de la propriete: as: si a besoin de la recuperer dans le code
            this._prop_name = "_"+this.from;
            
            //comme webservice, les données ne sont pas modifiable, donc ne binde pas les proprietes de l'objet
            //this.deep = false; on annule ca....
            //ajoute au alt pour etre prevenu d'un changement
            var params = this._url.getParametersNames();
            if(params){
                if (this.alt == undefined){
                        this.alt = params;
                } else {
                       this.alt += ","+params;
                }
            }
   
            
    } 
}
__webservice_model_binding.prototype = new __model_binding();
__webservice_model_binding.prototype.init = function(context){
        if (this._url != undefined){
                if (context[this._prop_name]==undefined){
                        //cree la prop et le setter
                        context[this._prop_name] = null;
                        var prop_name = this._prop_name;
                        
                        Object.defineProperty(context,this.from,{
                           get: function(){
                                   
                                   return this[prop_name];}
                        });
                }
                
                
                //lance la requete AJAX... directement???
                /*url = this._url.getURL(context);
                if (url) __load_async_datas (url, context, this.from)*/
        }
}
__webservice_model_binding.prototype.populate = function(value, context, extra){
        //ici, populate relance la requete ajax
        //("webservice populate: extra: "+extra);
        //(value); //pourquoi value = undefined????
        //(context);
        if (extra){
                //populate normal
                __model_binding.prototype.populate.call(this, value, context);
                
        } else {
                //chargement des données
                url = this._url.getURL(context);
                if (url) __load_async_datas (url, context, this._prop_name, this.from);
        }
}
    
    
    
    
/**permet de mettre a jour l'ui lorsqque les datas ont chang�es
@param key: le nom de la property qui a chang�e ou null pour mettre a jour toute la page
@args: parametres optinnels ou particulier a un type de binding*/
function notifyDatasetChanged(key, extra){

	//contexte a prendre en compte////
	if (key==null || key==''){
        //pas de process update ici, mise a jour a l'init...
       var name = null, bds = null, b= null;
       
        for(key in BINDINGS){
               //(key);
            name = key.split(':')[1];//nom de la property
            bds = [];
            for (i=0;i<BINDINGS[key].length;i++){
                b = BINDINGS[key][i];
                //("search: "+name);
                //("binding: "+b.from);
                if(b.from == 'COMMANDS' || b.from == name) bds.push(b);//doit reagir
            }
            __notifyDatasetChanged(CONTEXT, bds, key);
        }

    }
    else {
        CONTEXT.process_update = true;
        if (key in BINDINGS) {
			__notifyDatasetChanged(CONTEXT,BINDINGS[key], key, extra);
        }
        CONTEXT.process_update = false;

    }
}
//@ITERNAL: met a jour les bindings
//@param context: le context de données courant
//@param bindings: liste de binding a mettre a jour
//@param key: clé de binding
//@param extra: parametres optionnels
function __notifyDatasetChanged(context,bindings, key, extra){
        //("__notifyDatasetChanged");
        var value = 0, binding = null, v_key = null;
	for (var k in bindings) {
                //("populate "+k);
		value = null;
		binding = bindings[k];
                //(binding);
                //context = binding.context || CONTEXT;
                //(binding)

		if(key=='$this' || binding.from == '$this') value = context;//a voir....
		else{
                        
			v_key = binding.from;
                        
			if(context!= null && v_key in context){

				value = context[v_key];
                                
                                
			} else {
                               
                                //(context);
                                //(context[v_key]);
                        }
		}
                binding.populate(value, context, extra);

    }
}






// GESTION BINDINGS DE DONNEES -------------------------------------------------------------------------------------------------------
var __verif_regex__ = new RegExp(/[^\{]*(\{binding[^\}]+\})/g);//verifie si correspond a un binding
//var __regex__ = new RegExp(/(?:\s+([\w_\-]+):((?:\$\w[\w_\d]+)|(?:'[^']+')|(?:\[[\$']?[\$'\w\s,\._;%\-]+(?:,[\$']?[\$'\w\s,\._;%\-]+)*\])|(?:[^\s\}]+)))/g);//recupere les infos
/*explications:
        (?:\$\w[\w_\d]+) : une propriété du context ($ma_vvar)
        (?:'[^']+') : une string ('bonjour! Comment ça va?'): verifier les escaped quotes
        (?:[^\s\}]+): une string simple: from:qqchose
        (?:'[^']+')|(?:\[[\$']?[\$'\w\s,\._;%\-]+(?:,[\$']?[\$'\w\s,\._;%\-]+)*\]) : un tableau de valeurs: ['une phrase',truc,2,$machin]

*/
var __regex__ = new RegExp(/(?:\s+([\w_\-]+):((?:https?:\/\/[^ ]+)|(?:\$\w[\w_\d]+)|(?:'[^']+')|(?:\[[\$']?[\$'\w\s,\._;%\-]+(?:,[\$']?[\$'\w\s,\._;%\-]+)*\])|(?:[^\s\}]+)))/g);//recupere les infos

//TODO: finir la partie du tableau


//recupere les informations de bindings de la page
//@param root: elment dans lequel chercher les bindings
//@param process_event: indique si doit creer les bindings ou juste recuperer les infos
function __get_bindings(root, process_event, search){

    var evaluate = search || ".//*[contains(text(),'{binding ') or @*[contains(.,'{binding ')]]";
    
        //probleme! dois recuperer les bindings sur le root aussi!
        //comme ca, ne le recup pas...
	var binders = document.evaluate(evaluate,
            root,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null);
	//me renvois tout les elements de la page?????
	var elem = binders.iterateNext();//MODIF: passe au suivant
    var pg_bindings = [] , bindings = null;

    //recupere les elements de la page demandant un binding de donn�es


	while (elem != null){
                //parse tous les attributs pour trouver ceux bind�s
                bindings = __get_binding_from_attributes(elem, root, process_event);
                
                
                if (bindings==null || bindings.length == 0){
                                elem = binders.iterateNext();
                                continue;
                }
                
                __prepare_binding(bindings, process_event, pg_bindings);
                
		//MODIF
		elem = binders.iterateNext();

    }
    
    //test aussi pour le root???
    //MAIS renvoie un selector empty!!!
        bindings = __get_binding_from_attributes(root, root, process_event);
        if (bindings!=null && bindings.length > 0)__prepare_binding(bindings, process_event, pg_bindings);
                


    return pg_bindings;
}

// permet juste d'eviter de l'ecrire 2 fois pour les inner elements et le root
//surement possible en maitrisant mieux le xpath que moi....
function __prepare_binding(bindings, process_event, pg_bindings ){
        
        var j=bindings.length, k=null, keys=null;
        while(j--){
        //for (var j=0;j<bindings.length;j++){
                binding = bindings[j];
                //ici, bon endroit pour specifier un binding parent si existe...



            k = binding.from==null ? binding.command : binding.from ;
            

            if (k == null) {
                                continue;
                        }
//(binding);
            if (process_event){
                //traite aussi les alt
                keys = binding.getBindingKeys();

                        //pour chaque cl� de bindings....
                        var kk=keys.length;
                        while(kk--){
                        //for (kk = 0; kk<keys.length; kk++){
                                var key = keys[kk];
                                //si processinput, utilise UUID du contexte globale
                                key = CONTEXT.__uuid__+":"+key;
                                if (key in pg_bindings){
                                        //deja connu, ajoute simplement a la liste
                                        pg_bindings[key].push(binding);
                                }
                                else {
                                        //inconnu, cree une nouvelle entr�e
                                        pg_bindings[key]= [binding] ;
                                }
                        }
            } else {
                //enregistre simplement

                if (k in pg_bindings){
                    //deja connu, ajoute simplement a la liste
                    pg_bindings[k].push(binding);
                }
                else {
                    //inconnu, cree une nouvelle entr�e
                    pg_bindings[k]= [binding] ;
                }
            }
        }


                
}

//parse le contenu de la commande binding pour savoir quoi en faire
//TODO finir le parsing des commandes
//INTERNAL
//@param elem: l'element a etudier
//@param root: le root de l'elment
//@param process_event: si doit creer u pas le binding
function __get_binding_from_attributes(elem,root, process_event){
    var bindings = [];
//("Recherche les bindings....");
     var attrs = elem.attributes;

    //for (attr of elem.attributes){
        var ij = attrs.length;
        while(ij--){
	//for (ij=0; ij<attrs.length;ij++){
		attr = elem.attributes[ij];
		var bind = __parse_attribute (elem, root, attr.nodeName,attr.value, process_event );

		if(bind != null )bindings.push(bind);

    }

    //probleme, textContent pour un div passe avec les tags...
	/*if (elem.textContent != ''){
		//modif, ajoute le text
        //("recherche text content: "+elem.textContent);
		bind = __parse_attribute (elem, root, 'innerHTML', elem.textContent, process_event );

		if(bind != null )bindings.push(bind);
	}*/
    var nodes = elem.childNodes;
    var result = "";
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].nodeType == 3) {       // If it is a text node,
            // MIEUX VAUT MINIFIER LE HTML AUSSI!
    		result += nodes[i].textContent;
        }
    }
    result.trim();
    if(result != ""){
            //("analyse inner text "+result);
            
        var bind = __parse_attribute (elem, root, 'innerHTML', result, process_event );
        if(bind != null )bindings.push(bind);
    }



    return bindings;
}

//parse un attribut d'un element html et renvois les infos de bindings si en trouve
//INTERNAL
//@param elem: l'element etudié
//@param root: le root de l'element
//@param nodeName: le nom de l'attribut a etudier
//@param value: la valeur de l'attribut
//@param process_infos: si doit creer ou non le binding
//@return infos: informations de bindings ou le binding lui meme
function __parse_attribute(elem, root, nodeName, value, process_event){
	var cmds = value;

        if (cmds == null || cmds == '') return null;
        
        //verifie qu'il y a une chance d'avoir un binding dans cet attribut/valeur
        var match = __verif_regex__.exec(cmds);
        
        if (match == null) return null;//pas de correspondance pour le premier        //prends en compte plusieurs matches (par exemple pour les classes,????
        //while (match != null){
		cmds = match[1];//unqiuement les infos de bindings
                //cree le binding et populate (par regex)

		var d_b = [];//un tableau vide

		//si process event, recupere l'element, sinon, get path
                /*var cpy_elem = elem.cloneNode(true);
                //("clone element");*/
		d_b["_element"]= elem;//le html a binder
		d_b["root"] = root;//le root de l'element (si necessaire)
		d_b["path"] = getDomPath(elem, root);
                //probleme XPATH: ne dois pas modifier le document!
                //if (!cpy_elem.hasAttribute('id')) cpy_elem.setAttribute('id',generateUUID());
                //d_b["id"]=cpy_elem.getAttribute('id');
                
		var to=nodeName;//le nom de l'attribut
		//MODIF: si commence par data-binded-, extrait e nom de la property
		if(to.indexOf("data-binded-") == 0) {

			to=to.split('-')[2];
		}

		d_b["to"]=to;

		var match_index = __verif_regex__.lastIndex - cmds.length ;

		d_b['_index'] = match_index;//position dans la chaine
		d_b["_length"] = cmds.length;

		//recupere les commandes
		var match2 = __regex__.exec(cmds);
		while (match2 != null){
                        
			d_b[match2[1]] = match2[2];
			match2 = __regex__.exec(cmds);
		}
		__regex__.lastIndex = 0;//remet a zero pour leprochain coup

        __verif_regex__.lastIndex = 0;//remet a zero pour le prochain coup

       
        if (d_b["from"] == null && d_b["command"]==null) return null;
		d_b["process_event"] = process_event;


		var bind = d_b;

		//si doit etre utiliser de suite, cree le binding sinon, n'enregistre que les infos
		if (process_event){
            //doit passer la valeur si un array?
			bind = __create_binding_from_infos(d_b);
                        bind.init(CONTEXT);
		}



        
        return bind;
}

//fabrique pour les bindings
//@paam d_b: binding infos
//@param return: le binding trouvé
function __create_binding_from_infos(d_b){
    //renvoie le 'bon' type de binding
	//probleme, si 2way pour un input...
//(d_b);
    if(d_b["presenter"] != null){
        d_b.to = "innerHTML";
        //determine si le contexte de données est une liste ou un objet simple....
        if (d_b["from"].startsWith("http://")==true || d_b["from"].startsWith("https://")==true) return new __webservice_model_binding(d_b);
        return new __model_binding(d_b);
    }
    if(d_b["item_presenter"] != null){
        //affichage pour un array!

        d_b.to = "innerHTML";
        return new __array_binding(d_b);
    }
    if(d_b["command"] != null){

        return new __command_binding(d_b);
    }
	if (d_b["mode"] == '2way'){// && d_b._element.localName == 'input'){
		//consider input oblig�?
                
                //pas génial comme façon de faire.................................................................
                if (d_b._element.localName=="input"){
                        //le cas radiobox est particulier; si checked, renvoie value plutot que l'etat du button radio, c'est plus logique...
                        if (d_b._element.getAttribute("type")=="radio" && d_b.to == "checked"){
                                //demande a retourner value plutot que checked
                                d_b.return_value = true;
                                //force l'event sur le click
                                if (d_b.event == undefined) d_b.event = "click";     //sauf si s'en sert...
                                if (d_b.converter == undefined){
                                        d_b.converter="check_radio_value";
                                        d_b.converter_params="'"+d_b._element.value+"'";
                                }
                                 
                        } else if (d_b._element.getAttribute("type")=="text" && d_b._element.getAttribute("list")!=null){
                                //("Youhou, un select new style");
                                d_b.event = "input";
                        }
               
                }
		return new __input_binding(d_b);
	}
	if(d_b.to == 'innerHTML') return new __textContent_binding(d_b);
    if(d_b.forceAttr == null && d_b.to in d_b._element) return new __prop_binding(d_b);
    else{

		return new __attr_binding(d_b);
    }

}

//helper methode, retire les '' d'une propriete
//@temp en attendant de faire mieux pour la regex
function __unstringify(value){
        
    if (value!=null && value[0]=="'" && value[value.length-1]=="'"){
        //un tableau de parametres
        value = value.substring(1, value.length-1);
    }
    return value;
}


// Intialisation des bindings dans la page ----------------------------------------------------------------------------------

function AppInit(){
    //("AppInit");

        
	ctx = document.body.getAttribute("data-context");
	if (ctx == null) throw "No context defined!" ;//on verra plus tard!

	CONTEXT = window[ctx];
	if (CONTEXT == null)throw "No context defined!" ;//on verra plus tard!
	//cree le necessaire pour le binding //////////////////////////////////////////////////// MODIFS 0.2b
	defineBindObject(CONTEXT);

    //qqs property necessaires:
    //process_update: true/false: indique si est en train de mettre a jour les données
	//renvoie la classe necessaire
    CONTEXT["__process_update"] = false;
	Object.defineProperty(CONTEXT, "process_update",{
		get : function(){
            return this.__process_update;
		},
        set: function(value){
            if (this.__process_update != value){
                this.__process_update = value;
                key = this.__uuid__+":process_update";

                if (key in BINDINGS) {

                    __notifyDatasetChanged(this,BINDINGS[key], key);
                }
            }


        },
		enumerable: false,
	});

    //end_init: si true, initialisations terminées
    //en theorie, modifié 1 seule fois dans l'appli...
    CONTEXT["__end_init"] = false;
	Object.defineProperty(CONTEXT, "end_init",{
		get : function(){
            return this.__end_init;
		},
        set: function(value){
            if (this.__end_init != value){
                this.__end_init = value;
                key = this.__uuid__+":end_init";

                if (key in BINDINGS) {
                    __notifyDatasetChanged(this,BINDINGS[key], key);
                }
            }


        },
		enumerable: false,
	});
	
        //obliger: change les values de checkbox pour le data-binding
        /*checkboxes = document.querySelectorAll("input[type='checkbox']");
        if(checkboxes){
                for (cbi=0;cbi<checkboxes.length;cbi++){
                        checkboxes[cbi].value="";
                }
        }*/
        
        
        
        //si existent des models dans la page (ie: models globaux), recupere les
    var model_node = document.querySelector("body>div[data-role='presenters']");

    if (model_node != null){
        //n'affiche pas le contenu
        model_node.style.display = "none";

        models = model_node.querySelectorAll("body>div[data-role=presenters]>[data-role=presenter]");

        for (moi=0;moi<models.length;moi++){
            var model = models[moi];

            id = model.getAttribute("id");
//probleme EDGE et SVG: pas de children pour le SVG...
            if (id == null || (model.children==null && model.childNodes == null)) continue; //n'autorise pas de models sans id!
//("OK");

        //SI EDGE ET SVG, DOIT PASSER PAR ChildNodes????
                children = model.children;
                if (children==null){
                        //fait avec childnodes
                        children = [];
                        
                        end = model.childNodes.length ;
                        current = 0;
                        cn = model.childNodes;
                        do{
                                node = cn[current];
                                if (node.nodeType != 8 && (node.nodeType!=3 || /\S/.test(node.nodeValue))){
                                       
                                        children.push(node);;
                                }
                                //ajoute
                                
                                current++;
                        }while(current<end);
                }
        
			//ici, si plusieurs childs, veut dire plusieurs data-type
            if (children.length == 1){
                //cree les bindings pour ce model
                //("RECUP MODEL BINDINGS POUR: "+id);
            
                MODELS[id] = __get_bindings(children[0], false);//false: ne met pas en place les events handlers
            } else {
                //utilise des data-types, doit creer un binding par data-type
                for (c_i = 0; c_i < children.length; c_i++){
                    mdl = children[c_i];
                    
            
            
            
                    dtype = mdl.getAttribute("data-type");
                    //("RECUP MODEL BINDINGS POUR: "+id + "type: "+dtype);
                    if (dtype == null){
                        //model par defaut
                        MODELS[id] = __get_bindings(mdl, false);
                    } else {
                        //un datatype
                        MODELS[id+"_"+dtype] = __get_bindings(mdl, false);
                    }
                }
            }
        }

    }

	//les bindings de la page web...
	//probleme, ne doit pas refaire les bindings de models
	//et comment gerer l'ajout via xhr???
	//("Recupere les bindings de la page html");
    // ".//*[not(ancestor::div[@data-role='presenters']) and @*[contains(.,'{binding ')] or contains(text(),'{binding ')]"
    //*[not(@data-role='presenters')]
	BINDINGS = __get_bindings(document.body, true, "//*[not(ancestor::div[@data-role='presenters']) and (@*[contains(.,'{binding ')] or contains(text(),'{binding ')) ]");
        
       
	notifyDatasetChanged();

    CONTEXT.end_init = true;//notifie la fin du chargement...
}
//lance au chargement...
window.addEventListener("load",AppInit);
