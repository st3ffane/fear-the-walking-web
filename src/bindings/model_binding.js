//--require property_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  model_binding.js:

*/

function __model_binding(infos){
        
    if (infos == null) return;
    
    this.deep = infos.deep;             //binde les proprietes de l'objet??
    
    __prop_binding.call(this, infos);
    this.presenter = infos.presenter;	//le code html pour l'affichage des donn�es de l'objet
    this.merge = infos.merge;		//@deprecated compliqué a expliquer pour une utilisation tres reduite (voir exemple SVG)
    this.empty = infos.empty;

    
    //les data-types, met les en cache, de toute facon, il faudra les recuperer...
    //MAIS: recupere tous les types en place du type necessaire uniquement
    //a voir....
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

//nettoyage du binding
__model_binding.prototype._clean = function(root){
        
        if (root.firstChild != null) {
                var current_keys = root.firstChild._ftw2_keys;

                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){
                    
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

                                                if(BINDINGS[key].length == 0) delete(BINDINGS[key]);


                                        }

                                }
                                this._current_keys ={};//supprime?
                    
                        }
            root.removeChild(root.firstChild);
        }

}

//gestion du cas value==null
__model_binding.prototype._process_fallback = function(){
    

        //si value = null, affiche et bind le fallback
        if (this.fallback == null) {
                
            //regarde si a un datatype=fallback
            var p_type =  this.presenter;
            var presenter_type = p_type+"_fallback";

                if (presenter_type in MODELS){
                        return this._populate_model(CONTEXT, p_type, "fallback", false);

                } 


        } else {
            //affiche le fallback
            if (this._cache_fallback){
                //cree un nouveau model avec le fallback
                //binding du fallback: utilise le context global
                return this._populate_model(CONTEXT, this.fallback, "fallback", false);
            }
        }
}

//affiche le contenu du model
//@param context: l'objet javascript qui servira de context de données
//@param mroot: element HTML root du presenter (par defaut, recupere this.presenter)
//@param type: string type de la donnée (par defaut: context.constructor.name)
//@param deep: si doit binder les données du context (par defaut iinfos.deep)
__model_binding.prototype._populate_model = function(context, mroot,type, deep){
       
        defineBindObject(context);
        
        var model =null
        var bindings = null;


        //probleme, si heritage, doit verifier TOUTE la chaine de prototype...
        var item_type = type || context.constructor.name || "defaut";
        var p_type = mroot || this.presenter;


        
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
        	model = this._cache_types['fallback'];
        }
        else if(type=="empty"){
                bindings = MODELS[p_type+"_empty"] ;
        	model = this._cache_types['empty'];
        }
        else{
                while (proto != null){
                        var presenter_type = p_type+"_" + proto.constructor.name;
                        if (presenter_type in MODELS){

                                var item_type = proto.constructor.name;
                                bindings = MODELS[presenter_type] ;
                                model = this._cache_types[item_type];//root_model.querySelector("[data-type='"+item_type+"']");
                                break;
                        }
                        //sinon, suivant
                        proto = proto.__proto__;


                    }
        }
            
        if (model == null){
                //celui par defaut
                item_type = "defaut";
                bindings = MODELS[p_type] ;
                
                model = this._cache_types['defaut'];
        }



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
        
        
        for(var key in bindings){


                var bd = [];
                var h=bindings[key].length;
                while(h--){
                        //copie les infos du binding
                        var infos = {};
                        var inf = bindings[key][h];
                        for(var k in inf){
                                infos[k]=inf[k];
                        }

                        //autorise le process event
                        infos["process_event"] = true;
                        
                        infos._element = cpy_model;
                        if (infos.path)	infos._element = cpy_model.querySelector(infos.path);
                        
                        
                        var clone = __create_binding_from_infos(infos);//cree le binding, passe la valeur a binder pour determiner le type

                        if (context.__uuid__ && deep_binding === true){
                                //gestion du 'alt' ------------------------------------------------
                                var keys =  this.getBindingKeys(infos);
                                var kk = keys.length;
                                while(kk--){
                                //enregistre les bindings
                                    var n_key = keys[kk];

                                    //si processinput, utilise UUID du contexte globale
                                    var g_key =context.__uuid__+":"+n_key;
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
                        bd.push(clone);
                        clone.init(context);

                }

                __notifyDatasetChanged(context,bd, key);
        }

       

        frag._ftw2_keys = current_keys;
        return frag;
    }
    
    
    
	
__model_binding.prototype.populate = function(context, parent, extra){
	
        
        var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;
        
        var parent = this._element.parentNode;
        
        
        var frag = this._element;
        
        var context = this.convert_value (context, parent);
        
        
        this._clean(frag);

        if (context == null ){
                //modif, utilise le fallback comme data-type
                frag.appendChild(this._process_fallback());


        }
        else{
                //ajoute l'element d'un coup, pas besoin de fragment?
                frag.appendChild(this._populate_model(context));//le html generé
        }

		
        //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
}

    
    