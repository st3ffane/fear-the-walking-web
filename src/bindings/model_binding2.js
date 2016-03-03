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
  
  - eviter de recréer a chaque fois les elements HTML et les bindings....
        probleme: stocke dans l'element HTML les bindings crées par le model
        MIEUX: stocke dans le model_binding les bindings qu'il a crée!
        + chaque model a un recycle bin, mieux: chaque type de model a un recycle bin...
  - 

*/
//un conteneur pour les elements HTML recyclés
function RecycledView (){
        this._recycle_bin = {};
}
RecycledView.prototype = new __prop_binding();
//ajoute une element au recycle bin NEW ################################"
RecycledView.prototype.recycle = function(type,stack){
        if (this._recycle_bin[type] == null) this._recycle_bin[type]=[];
        this._recycle_bin[type].push(stack);
}

var MODELS_BINS = {};//pour stocker les differents recycle bins par types

//recupere une vue et ses bindings depuis le cache NEW ###############""
RecycledView.prototype.obtain = function(context,type){
        //renvoie l'elemeent html root de cette vue et les bindings associes
        //verifie toute le chaine de prototype
        //(context);
        //(type)
        
        if (type == "fallback") {
                if (this._recycle_bin[type] != undefined && this._recycle_bin[type].length > 0) return this._recycle_bin[type].splice(0,1)[0];
                else return null;
        }
        var proto = context.__proto__;
        //(context.constructor)
        while (proto != null){

            presenter_type =  proto.constructor.name;
            //("Recherche stack pour:"+presenter_type)
            if(this._recycle_bin[presenter_type]!=undefined && this._recycle_bin[presenter_type].length > 0) {
                //("trouve dans le stack!!!");
                return this._recycle_bin[presenter_type].splice(0,1)[0];
            }
            //sinon, suivant
            proto = proto.__proto__;


        }
        //celui par defaut?
        //("Recherche stack pour: defaut ")
        type="defaut";
        if(this._recycle_bin[type]!=undefined && this._recycle_bin[type].length > 0) return this._recycle_bin[type].splice(0,1)[0];
        return null;
}
function __model_binding(infos){
        
    if (infos == null) return;
    
    this.deep = infos.deep;             //binde les proprietes de l'objet??
    
    __prop_binding.call(this, infos);
    
    this.presenter = infos.presenter;	//le code html pour l'affichage des donn�es de l'objet
    this.merge = infos.merge;		//@deprecated compliqué a expliquer pour une utilisation tres reduite (voir exemple SVG)
    this.empty = infos.empty;           //rien a foutre ici, a moins de créer une methode du style is_empty pour les objets aussi

    //si a deja utilisé ce presenter, a deja un recycle bin de crée
    console.log(MODELS_BINS);
    console.log(this.presenter);
    //probleme, supprime les methodes derrieres...
    if (this.presenter in MODELS_BINS){
            console.log("recup proto");
            this.__proto__ = MODELS_BINS[this.presenter];
    }
    else{
            console.log("create proto");
            //sinon, crée en un...
            var mb=new RecycledView();
            this.__proto__ = mb;
            MODELS_BINS[this.presenter] = mb;
    }
    // NEW ######################################
    
    
    
    //les data-types, met les en cache, de toute facon, il faudra les recuperer...
    //MAIS: recupere tous les types en place du type necessaire uniquement
    //a voir....
    //OU le faire au moment de la création des models a l'init                                  ==========> TODO
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
                //cree une entrée dans le recycle_bin???
                //this._recycle_bin[type]=[];
                
        }
        if (this.fallback) this._cache_types['fallback'] = document.getElementById(this.fallback);
        if (this.empty) this._cache_types['empty'] = document.getElementById(this.empty);
    }
    
    
}




//nettoyage du binding
//NEW: recycle la vue et les bindings pour eviter d'avoir a les recreer a chaque fois
RecycledView.prototype._clean = function(root, child){
        var stack = {html:null, bindings:[]};//pour sauvegarder la vue et les bindings associes
        
        var old_type = 'defaut';//le type d'objet affiché
        
       
        if (child == undefined) child = root.firstChild;
        
        
        if (child != null) {
                var current_keys = child._ftw2_keys;
                
                
                var model_bindings = []; //les bindings de cette vue
                
                
                stack.html = child; //l'element html de la vue
                old_type = child._ftw2_type;
                
                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){
                    
                        var current = null, cr = null, index = 0, test = null;
            
                        for (var key in current_keys){
                                //supprime de la page
                                current = current_keys[key];
                                glob_binding = BINDINGS[key];
                                
                                if(!glob_binding) continue;
                                
                                var bi = current.length;
                                while(bi--){
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
                        //this._current_keys ={};//supprime?
                        stack.bindings = model_bindings; //les bindings necessaires
                }
            //sauvegarde dans le stack
            //probleme, les listeners sont toujours present!!!!!!                                      ======> TODO
            this.__proto__.recycle(old_type, stack);
            removeChildAndClearEvents(root, child);
        }

}

//gestion du cas value==null
RecycledView.prototype._process_fallback = function(){
    

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
RecycledView.prototype._populate_model = function(context, mroot,type, deep){
       
        defineBindObject(context);
        console.log("POPULATE MODEL");
        var model =null
        var bindings = null;


        //probleme, si heritage, doit verifier TOUTE la chaine de prototype...
        var item_type = type || context.constructor.name || "defaut";
        var p_type = mroot || this.presenter;


        
        var frag =null;
        var current_keys = [];//les clés crées pour ce model
        var deep_binding = deep || this.deep || true;//pour savoir si rend accessible les données internes au binding

     
        

        var proto = context;
        //var item_type = "";

        //tente de recuperer un element du stack de recyclage
        var old_stack =  this.__proto__.obtain(context, type);
        if (old_stack != null){
                console.log("une vue recyclée est présente, utilise la!");
                var model_bindings = old_stack.bindings;
                var current_keys = [];

                //recupere les bindings et initialise les
                for (var mbi=0;mbi<model_bindings.length;mbi++){
                        var mbd = model_bindings[mbi];
                        if(mbd.init != null) mbd.init(context);//initialise, ie, met en place les listeners?

                        //inscription des clés d'events: uniquement si demandé, ou par defaut?
                        
                            //gestion du 'alt' ------------------------------------------------
                            keys = this.getBindingKeys(mbd._infos);

                            for (kk = 0; kk<keys.length; kk++){
                                n_key = keys[kk];
                                //enregistre les bindings et notify
                                g_key = context.__uuid__+":"+n_key;
                                //("create key: "+g_key);
                                if (deep_binding){
                                        if (g_key in BINDINGS){
                                            //deja connu, ajoute simplement a la liste
                                            BINDINGS[g_key].push(mbd);
                                        }
                                        else {
                                            //inconnu, cree une nouvelle entr�e
                                            BINDINGS[g_key]= [mbd] ;
                                        }
                                }
                                //enregistre pour pouvoir nettoyer plus tard....
                                if (g_key in current_keys){
                                    //deja connu, ajoute simplement a la liste
                                    current_keys[g_key].push(mbd);
                                }
                                else {
                                    //inconnu, cree une nouvelle entr�e
                                    current_keys[g_key]= [mbd] ;
                                }

                            
                        }

                }


                //pour chq binding recuperé, doit mettre  a jour...
                
                __notifyDatasetChanged (context,model_bindings );
                frag = old_stack.html;

        } 
        else {
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
                                 
                                if (context.__uuid__){
                                        //gestion du 'alt' ------------------------------------------------
                                        var keys =  this.getBindingKeys(infos);
                                        var kk = keys.length;
                                        while(kk--){
                                        //enregistre les bindings
                                            var n_key = keys[kk];

                                            //si processinput, utilise UUID du contexte globale
                                            var g_key =context.__uuid__+":"+n_key;
                                            if(deep_binding){
                                                    if (g_key in BINDINGS){
                                                        //deja connu, ajoute simplement a la liste
                                                        BINDINGS[g_key].push(clone);
                                                    }
                                                    else {
                                                        //inconnu, cree une nouvelle entr�e
                                                        BINDINGS[g_key]= [clone] ;
                                                    }
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
                                            //current_keys.push(g_key);//what if plusieurs fois la meme????


                                        }
                                }

                                //enregistre le binding
                                bd.push(clone);
                                clone.init(context);

                        }
                        
                        __notifyDatasetChanged(context,bd, key);
                }
                
                
        }
       

        frag._ftw2_keys = current_keys; // il faudrait eviter de stocker des infos dans les elements html ==================> TODO
        return frag;
    }
    
    
    
	
RecycledView.prototype.populate = function(context, parent, extra){
	
        
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

    
    