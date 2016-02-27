/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  

*/


var CONTEXT = null;     //data context de l'application/page web
var BINDINGS = [];      //dictionnaire associant clé de binding a liste d'elements a prevenir
var MODELS = {};	//des binding models a ajouter/supprimer des pages

   

//QQS méthodes qui sont appellées a disparaitre dans les prochaines versions

//modifie un peu le html pour gerer les listes d'events
HTMLElement.prototype._addEventListener = HTMLElement.prototype.addEventListener
//Ajoute un ecouteur d'event a l'element html
//@param a: le nom de l'event a ecouter (ex: load, change...)
//@param b: la methode a executer
HTMLElement.prototype.addEventListener = function(a,b) {
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
	clear_events(child);
}
//supprime les ecouteurs d'events des elements html
//@param child: l'element a qui supprimer les ecouteurs (lui et ses enfants)
function clear_events (child){
    //uniqument pour lui ou aussi pour les inners????
	if(child.eventListenerList){
                var events = null;
                var j=0;
		for (key in child.eventListenerList){
				events = child.eventListenerList[key];
                                j = events.length;
                                while (j--){
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
			elem = child.children[ci];
			clear_events(elem);
		}

	}
}
   
   
   
   
   
   
   
   
/*permet de mettre a jour l'ui lorsqque les datas ont chang�es
@param key: le nom de la property qui a chang�e ou null pour mettre a jour toute la page
@args: parametres optinnels ou particulier a un type de binding*/
//@private
function notifyDatasetChanged(key, extra){

        //contexte a prendre en compte////
        if (key==null || key==''){
                //en général, ce cas n'arrive qu'a l'initialisation de la page
                var name = null, bds = null, b= null;
               
                for(key in BINDINGS){
                    name = key.split(':')[1];//nom de la property
                    bds = [];
                    for (i=0;i<BINDINGS[key].length;i++){
                        b = BINDINGS[key][i];
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
//@private
function __notifyDatasetChanged(context,bindings, key, extra){
       
        var value = 0, binding = null, v_key = null;
        for (var k in bindings) {
                value = null;
                binding = bindings[k];
               
                if(key=='$this' || binding.from == '$this') value = context;//a voir....
                else{
                        
                        v_key = binding.from;                        
                        if(context!= null && v_key in context){
                                value = context[v_key];                
                                
                        } else {
                               
                                //normalement, ici, il faudrait que je fasse quelquechose...
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
        var binders = document.evaluate(evaluate,
            root,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null);
        
        
        var elem = binders.iterateNext();
        var pg_bindings = [] , bindings = null;

        //recupere les elements de la page demandant un binding de données
        while (elem != null){
                //parse tous les attributs pour trouver ceux bindés
                bindings = __get_binding_from_attributes(elem, root, process_event);
                
                
                if (bindings==null || bindings.length == 0){
                                elem = binders.iterateNext();
                                continue;
                }
                
                __prepare_binding(bindings, process_event, pg_bindings);
                elem = binders.iterateNext();

        }
            
        //test aussi pour le root
        bindings = __get_binding_from_attributes(root, root, process_event);
        if (bindings!=null && bindings.length > 0)__prepare_binding(bindings, process_event, pg_bindings);
                


    return pg_bindings;
}

// permet juste d'eviter de l'ecrire 2 fois pour les inner elements et le root
//surement possible en maitrisant mieux le xpath que moi....
function __prepare_binding(bindings, process_event, pg_bindings ){
        
        var j=bindings.length, k=null, keys=null;
        while(j--){
                binding = bindings[j];

                k = binding.from==null ? binding.command : binding.from ;
            

                if (k == null)  continue;
                
                if (process_event){
                //traite aussi les alt
                keys = binding.getBindingKeys();

                        //pour chaque clé de bindings....
                        var kk=keys.length;
                        while(kk--){
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
        var attrs = elem.attributes;
        var ij = attrs.length;
        
        while(ij--){
        
                attr = elem.attributes[ij];
                var bind = __parse_attribute (elem, root, attr.nodeName,attr.value, process_event );

                if(bind != null )bindings.push(bind);

        }

    
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
        
                cmds = match[1];//unqiuement les infos de bindings
                //cree le binding et populate (par regex)

                var d_b = [];//un tableau vide

                //si process event, recupere l'element, sinon, get path
                
                
                d_b["_element"]= elem;//le html a binder
                d_b["root"] = root;//le root de l'element (si necessaire)
                d_b["path"] = getDomPath(elem, root);//path CSS vers l'element
                //probleme XPATH: ne dois pas modifier le document!
                
                
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
    if(d_b["presenter"] != null){
        d_b.to = "innerHTML";
        //determine si le contexte de données est une liste ou un objet simple....
        if (d_b["from"].startsWith("http://")==true || d_b["from"].startsWith("https://")==true) return new __webservice_model_binding(d_b);
        return new __model_binding(d_b);
    }
    if(d_b["item_presenter"] != null){
        //affichage pour un array!
        d_b.to = "innerHTML";
        d_b.presenter = d_b.item_presenter;
        d_b.item_presenter = null; //Fondre les models et array dans un meme binding???
        return new __array_binding(d_b);
    }
    if(d_b["command"] != null){
        return new __command_binding(d_b);
    }
        if (d_b["mode"] == '2way'){// && d_b._element.localName == 'input'){
                
                //pas génial comme façon de faire.................................................................
                if (d_b._element.localName=="input"){
                        //le cas radiobox est particulier; si checked, renvoie value plutot que l'etat du button radio, c'est plus logique...
                        if (d_b._element.getAttribute("type")=="radio" && d_b.to == "checked"){
                                //demande a retourner value plutot que checked
                                d_b.return_value = true;
                                //force l'event sur le click
                                if (d_b.event == undefined) d_b.event = "click";     //sauf si s'en sert...
                                if (d_b.converter == undefined){
                                        d_b.converter="ftw2:check_radio_value";
                                        d_b.converter_params="'"+d_b._element.value+"'";
                                }
                                 
                        } else if (d_b._element.getAttribute("type")=="text" && d_b._element.getAttribute("list")!=null){
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


// Intialisation des bindings dans la page ----------------------------------------------------------------------------------

function AppInit(){
        
        ctx = document.body.getAttribute("data-context");
        if (ctx == null) throw "No context defined!" ;//on verra plus tard!

        CONTEXT = window[ctx];//A MODIFIER: passe plutot le type de l'objet pour le creer moi meme.
        if (CONTEXT == null)throw "No context defined!" ;//on verra plus tard!
        
        defineBindObject(CONTEXT);

        //qqs property necessaires:
        //process_update: true/false: indique si est en train de mettre a jour les données
        
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
        

                        //SI EDGE ET SVG, DOIT PASSER PAR ChildNodes????
                        children = model.children;
                        if (children==null){
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
                                MODELS[id] = __get_bindings(children[0], false);//false: ne met pas en place les events handlers
                        } else {
                                //utilise des data-types, doit creer un binding par data-type
                                for (c_i = 0; c_i < children.length; c_i++){
                                    mdl = children[c_i];
                                    dtype = mdl.getAttribute("data-type");
                                    
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
        BINDINGS = __get_bindings(document.body, true, "//*[not(ancestor::div[@data-role='presenters']) and (@*[contains(.,'{binding ')] or contains(text(),'{binding ')) ]");
        
       
        notifyDatasetChanged();

        CONTEXT.end_init = true;//notifie la fin du chargement...
}


//lance au chargement...
window.addEventListener("load",AppInit);
        
        