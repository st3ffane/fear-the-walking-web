//--require property_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
todo: systeme de recyclage de vues

*/

function __model_binding(infos){
        
    if (infos == null) return;
    
    this.deep = infos.deep || true;             //binde les proprietes de l'objet??
    
    __prop_binding.call(this, infos);
    this.presenter = infos.presenter;	//le code html pour l'affichage des donn�es de l'objet
    this.merge = infos.merge;		//@deprecated compliqué a expliquer pour une utilisation tres reduite (voir exemple SVG)
    this.empty = infos.empty;

    this._empty = false;
    
    this._child_binding = []; //les bindings générées par ce model
    this._generated_keys = [];//les clés de ce binding!
    this._ftw2_type = null;//le type de données actuellement affichée
    
    
    
    //les data-types, met les en cache, de toute facon, il faudra les recuperer...
    //MAIS: recupere tous les types en place du type necessaire uniquement
    //a voir....
    
    
    //probleme, chq model_binding correspond a un MODEL[id ou id_type]
    
    //a passer dans AppInit!!!!                                 ====> TODO
    /*model = document.getElementById(this.presenter);
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
    }*/
    
    
}
__model_binding.prototype = new __prop_binding();

//nettoyage du binding
__model_binding.prototype._clean = function(root, child, index){
        if (root == null) root = this._element;
        if (child == undefined) child = root.firstChild;
        if (index == undefined) index = 0;
        
        
        
        if (child != null) {
                var type = child._ftw2_type;//le type de données stockées dans l'element
                //("type de donnée a recycler:"+type);
                //les clés générées par ce model
                var current_keys = this._generated_keys.splice(index,1)[0];
                
                var model_bindings = {}; //les bindings de cette vue
                
                //("clean model datas");
                //(current_keys);
                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){
                        var current = null, cr = null, index = 0, test = null;
                        
                        for (var key in current_keys){
                                //(key);//clé type UUID:nom
                                //si tableau, probleme....
                                //supprime de la page
                                current = current_keys[key];
                                glob_binding = BINDINGS[key];
                                
                                /*if(!glob_binding) continue;*/
                                
                                var bi = current.length;
                                while(bi--){
                                //for (var bi=0;bi<current.length;bi++){
                                        cr = current[bi];
                                        //nettoie au besoin
                                        //("cleaning");
                                        cr._clean();
                                        //supprime  le context si existe
                                       
                                        if (cr.context) cr.context= null;
                                        if(glob_binding && key in glob_binding){
                                                index = glob_binding[key].indexOf(cr);

                                                test = glob_binding[key].splice(index,1)[0];
                                                if(glob_binding[key].length == 0) delete(glob_binding[key]);
                                        }

                                        //ajoute au model_bindings pour le recyclage
                                        var from = cr.from;
                                        if (!(from in model_bindings)) model_bindings[from]=[];
                                        model_bindings[from].push(cr);
                                }
                                

                        }
                }
            //sauvegarde dans le stack
            removeChildAndClearEvents(root, child);
            var template = MODELS[type];
            //("Enregistre un nouveau recycle pour le type:"+type);
            //(model_bindings);
            template.recycle.push( [child, model_bindings ])
        }

}

//gestion du cas value==null
__model_binding.prototype._process_fallback = function(){
    

        //si value = null, affiche et bind le fallback
        //check d'abord le data-type!!!
        //regarde si a un datatype=fallback
            var p_type =  this.presenter;
            var presenter_type = p_type+"_fallback";

                if (presenter_type in MODELS){
                        return this._populate_model(CONTEXT, p_type, "fallback", false);

                } 

                
                //si ici, pas de data-type=fallback, cherche le fallback normal?
                
        if (this.fallback) {
                
            //affiche le fallback
                //cree un nouveau model avec le fallback
                //binding du fallback: utilise le context global
                return this._populate_model(CONTEXT, this.fallback, "fallback", false);
            
        }
        
        //si ici, pas de fallback, pas de type, renvoie juste une infos simple?
        return document.createTextNode("");//tostring sur context
}



// AFFICHAGE OBJET SIMPLE
//affiche le contenu du model
//@param context: l'objet javascript qui servira de context de données
//@param mroot: element HTML root du presenter (par defaut, recupere this.presenter)
//@param type: string type de la donnée (par defaut: context.constructor.name)
//@param deep: si doit binder les données du context (par defaut iinfos.deep)
__model_binding.prototype._populate_model = function(context, mroot,type, deep){
       
       
        // UTILISER UN STACK DE RECYCLAGE =====================================> TODO
        //probleme, parfois, ne doit pas utiliser le converter...
        defineBindObject(context);
        //la convertion au besoin
        //context = this.convert_value (value, parent);
        var context = this.convert_value (context, mroot);
        
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
        var recycle = null;

        var proto = context;
        var item_type = "";
        
        this._ftw2_type = null;
        
        //verifie si existe dans le stack de recyclage...            =======================> TODO

        //recherche le model
        if (type=="fallback"){
                var md = MODELS[p_type+"_fallback"];
                if(md){bindings = md.bindings;
                model = md.template;
                recycle = md.recycle;
                this._ftw2_type = p_type+"_fallback";}
                /*bindings = MODELS[p_type+"_fallback"] ;
        	model = this._cache_types['fallback'];*/
        }
        else if(type=="empty"){
                /*bindings = MODELS[p_type+"_empty"] ;
        	model = this._cache_types['empty'];*/
                var md = MODELS[p_type+"_empty"];
                if(md){bindings = md.bindings;
                model = md.template;
                recycle = md.recycle;
                
                this._ftw2_type = p_type+"_empty";}
        }
        else{
                while (proto != null){
                        var presenter_type = p_type+"_" + proto.constructor.name;
                        if (presenter_type in MODELS){

                                var item_type = proto.constructor.name;
                                /*bindings = MODELS[presenter_type] ;
                                model = this._cache_types[item_type];//root_model.querySelector("[data-type='"+item_type+"']");*/
                                var md = MODELS[presenter_type];
                                if(md){bindings = md.bindings;
                                model = md.template;
                                recycle = md.recycle;
                                
                                this._ftw2_type = presenter_type;
                                break;}
                        }
                        //sinon, suivant
                        proto = proto.__proto__;


                    }
        }
            
        if (model == null){
                //celui par defaut
                item_type = "defaut";
                /*bindings = MODELS[p_type] ;
                
                model = this._cache_types['defaut'];*/
                var md = MODELS[p_type];
                if(md){
                bindings = md.bindings;
                model = md.template;
                recycle = md.recycle;
                this._ftw2_type = p_type;
                }
        }



        if (model == null ){

                //this._element[this.to] = " unknown model! "+context;//pas de model, ne fait rien
                return;
        }

        
        //("populate model: item type: "+this._ftw2_type);
        if (recycle.length > 0){
                //recupere la template et bindings associés
                //("Recuperation d'un template dans recycle!");
                var r = recycle.pop();
                frag = r[0];
                bindings = r[1];
                //(bindings);
                //enregistre les bindings
                for(var key in bindings){
                        //("clé:"+key);

                        var bd = [];
                        var h=bindings[key].length;
                        //("nbr de bindings: "+h);
                        while(h--){
                                var clone = bindings[key][h];
                                //(clone);
                                //copie les infos du binding
                                /*var infos = {};
                                var inf = bindings[key][h];
                                for(var k in inf){
                                        infos[k]=inf[k];
                                }

                                //autorise le process event
                                infos["process_event"] = true;
                                
                                infos._element = cpy_model;
                                if (infos.path)	infos._element = cpy_model.querySelector(infos.path);
                                
                                
                                var clone = __create_binding_from_infos(infos);//cree le binding, passe la valeur a binder pour determiner le type
                                //("deep:"+deep_binding);
                                //(context.__uuid__);*/
                                if (context.__uuid__){
                                        //gestion du 'alt' ------------------------------------------------
                                        var keys =  clone.getBindingKeys();
                                        var kk = keys.length;
                                        while(kk--){
                                        //enregistre les bindings
                                            var n_key = keys[kk];
                                            
                                            //si processinput, utilise UUID du contexte globale
                                            var g_key =context.__uuid__+":"+n_key;
                                            //("clé de binding: "+g_key);
                                            if ( deep_binding === true){
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


                                        }
                                }

                                //enregistre le binding
                                bd.push(clone);
                                //("notify recycle");
                                clone.init(context);

                        }

                        __notifyDatasetChanged(context,bd, key);
                }
        }
        else
        {
                //("Creation d'un nouveau model");
                var cpy_model = model.cloneNode(true);
                frag = cpy_model;
        
        
                //cree les bindings necessaires
        
                for(var key in bindings){
                        //("clé:"+key);

                        var bd = [];
                        var h=bindings[key].length;
                        //("nbr de bindings: "+h);
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
                                //("deep:"+deep_binding);
                                //(context.__uuid__);
                                if (context.__uuid__){
                                        //gestion du 'alt' ------------------------------------------------
                                        var keys =  this.getBindingKeys(infos);
                                        var kk = keys.length;
                                        while(kk--){
                                        //enregistre les bindings
                                            var n_key = keys[kk];
                                            
                                            //si processinput, utilise UUID du contexte globale
                                            var g_key =context.__uuid__+":"+n_key;
                                            //("clé de binding: "+g_key);
                                            if ( deep_binding === true) {
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


                                        }
                                }

                                //enregistre le binding
                                bd.push(clone);
                                clone.init(context);

                        }

                        __notifyDatasetChanged(context,bd, key);
                }

        }
        //("nbr de clés de bindings global crées: ");
        //(current_keys);
        //doit ajouter a la fin du tableau...
        //probleme, si array, se retrouve avec pour chq items un array de bindings
        //modif, enregistre les keys en tant 
        frag._ftw2_type = this._ftw2_type;//le type de données pour cette vue
        this._generated_keys.push(current_keys);
        //probleme, pour un array, toutes les clés seront présentes, doit faire une selection...
        //this._generated_keys = current_keys;//enregistre les clés de bindings de ce model uniquement!
        return frag;
    }
    
    

__model_binding.prototype.populate_object = function(context, parent, extra, frag){
        /*var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;
        
        var parent = this._element.parentNode;
        
        
        var frag = this._element;
        
        
        fragment.appendChild(frag);
        defineBindObject(context);
        //la convertion au besoin
        value = this.convert_value (value, parent);*/
        
        
        this._clean(frag);

        //un objet DOIT tenter de binder l'objet
        if (context == null ){
                //modif, utilise le fallback comme data-type
                frag.appendChild(this._process_fallback());


        }
        else{
                //ajoute l'element d'un coup, pas besoin de fragment?
                frag.appendChild(this._populate_model(context));//le html generé
        }

		
        //replace l'element dans la page
        //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
}

  
//AFFICHAGE ARRAY

__model_binding.prototype.populate_array = function (value, context, extra, frag){

        //definie les actions par defaut (ie: pas d'extras)
        //recupere l'element et place le dans un fragment pour eviter les reflows
        /*var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;

        var parent = this._element.parentNode;
        var frag = this._element;


        fragment.appendChild(frag);//ajoute directement l'element au fragment...

        //si un textnode, supprime
        if (frag.firstChild && frag.firstChild.nodeType===3) removeChildAndClearEvents(frag,frag.firstChild);//frag.removeChild(frag.firstChild);
        */
        defineBindObject(context);
        //la convertion au besoin
        //value = this.convert_value (value, parent);

        if (value == null){
                this._empty = true; //marque empty
                
                //si a des childs, supprime les tous
                while (frag.firstChild) {
                        //frag.removeChild(frag.firstChild);
                        removeChildAndClearEvents(frag,frag.firstChild);
                }
            
            
                frag.appendChild(this.process_fallback());
                
            
                //replace l'element dans la page
                //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                return;
        }
        
        
        
        if (value.length == 0){
                  this._empty = true; //marque empty
                
                //si a des childs, supprime les tous
                while (frag.firstChild) {
                        //frag.removeChild(frag.firstChild);
                        removeChildAndClearEvents(frag,frag.firstChild);
                }
                if (this.empty ){                             
                    frag.appendChild(this._populate_model(CONTEXT, this.empty, "empty", false));
                }
                //replace l'element dans la page
                //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                return;
        }

        if (this._empty){
                //supprime la empty view
                while (frag.firstChild) {
                        //frag.removeChild(frag.firstChild);
                        removeChildAndClearEvents(frag,frag.firstChild);
                }
                this._empty = false;
                
        }
        
        //si un extra, modifie les actions...
        if (extra != null){
            
            //suivant l'action (set,push,...) agit au mieux...
            switch(extra.action){
                case 'SET':{
                    //modifie 1 seul element, ie: supprime et remet en place
                    var ci = extra.index;

                    //nettoie les elements html inutiles si besoin
                    //this._clean_child(frag.children[ci], frag);
                    this._clean(frag, frag.children[ci], ci);
                    var item = value[ci];
                    var result = this._populate_item(item);
                    //result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                    
                    var prec = ci == 0 ? frag.firstChild : frag.children[ci-1];
                    frag.insertBefore(result,prec);
                    //replace l'element dans la page
                    //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    
                    return ;


                }
                case 'POP':{
                    //supprime le  dernier de la listes
                    //this._clean_child(frag.children[frag.children.length -1], frag);
                    this._clean(frag, frag.children[frag.children.length -1],frag.children.length -1);
                    //replace l'element dans la page
                    //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'PUSH':{
                    //ajoute a la fin
                    var count = extra.value
                    //recupere les counts derniers elements
                    var  add_childs = [];
                    var first = value.length - count;
                    for (var c=value.length-1;c>= first; c--){add_childs.push(value[c]);}
                    for (var ci=0; ci<add_childs.length;ci++){
                            
                        var item = add_childs[ci];
                        var result = this._populate_item(item);
                        //result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                       frag.appendChild(result);
                    }
                    //replace l'element dans la page
                    //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'SHIFT':{
                    //retire le premier element
                    //this._clean_child(frag.children[0],frag);
                    this._clean(frag, frag.children[0],0);
                     //replace l'element dans la page
                    //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
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
                        var result = this._populate_item(item);
                        //result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                        frag.insertBefore(result, frag.firstChild);
                    }
                    //replace l'element dans la page
                    //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'SPLICE':{
                    //supprime ET ajoute
                    var index=extra.index;//probleme, si IE???
                    var howmany=extra.howmany;
                    var count = extra.count;
                    
                    
                    for (var ci=index;ci<index+howmany;ci++){
                            ////(frag.children[index]);
                            this._clean(frag, frag.children[index], ci);
                            //this._clean_child(frag.children[ci],frag);//par defaut, supprime tous les childs de la liste
                    }
                    

                    //si doit ajouter en position...
                    if (count != undefined && count >0){
                        var add_childs = [];
                        var prec = frag.children[index];
                        for (var c=count - 1 ;c>=0; c--){add_childs.push( value[index+c]);}
                        for (var ci=0; ci<add_childs.length;ci++){
                            var item = add_childs[ci];
                            var result = this._populate_item(item);
                            //result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                            frag.insertBefore(result, prec);
                            
                        }


                    }
                    //replace l'element dans la page
                    //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;

                }
                default: break;
            }
        }



        //("remove all array!");
        
        var removeChilds = frag.children ;
        if (removeChilds==null){
                removeChilds = [];
                var childs = frag.childNodes;
                var end = childs.length;
                for (i= 0; i< end; i++){
                      if (childs[i].nodeType != 8 && (childs[i].nodeType != 3 || /\S/.test(childs[i].nodeValue))){
                              removeChilds.push( childs[i] );
                              
                      }
                }
        }
        //nettoie les elements html inutiles si besoin
        for(var ci=removeChilds.length-1;ci>=0;ci--){
            //this._clean_child(removeChilds[ci], frag);
            this._clean(frag, removeChilds[ci], ci);
        }

        //ajoute les nouveaux elements
        for (var ci=0; ci<value.length;ci++){
            var item = value[ci];
            var result = this._populate_item(item);
            frag.appendChild(result);
        }
        //affichage des groupes

        this._key_uuid_ = context.__uuid__+":"+this.from;
        //replace l'element dans la page
        //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}

};



__model_binding.prototype._populate_item = function(context, parent, extra){
    
        if (context == null ){
                //modif, utilise le fallback comme data-type
                return this._process_fallback();
        }

        //ajoute l'element d'un coup, pas besoin de fragment?
        ////("populate item");
        var child = this._populate_model(context);//le html generé

        this._key_uuid_ = context.__uuid__+":"+this.from;
        return child;

}


//MODIFICATION: determine au runtime si la data est un tableau (DBArray) ou un objet simple...

__model_binding.prototype.populate = function(value, parent, extra){
	//probleme, si array, doit faire ca  a chaque item....
        
        //defineBindObject(value);
        
        var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;

        var parent = this._element.parentNode;
        var frag = this._element;
        //si un textnode, supprime
        if (frag.firstChild && frag.firstChild.nodeType===3) frag.removeChild(frag.firstChild);

        //force le redraw aussi?
        fragment.appendChild(frag);//ajoute directement l'element au fragment...
        
        //probleme! si deep=false et array, n'est pas detecté!!!
        if (value && (value.__proto__ == DBArray || value instanceof Array) ) this.populate_array(value,parent,extra,frag);
        else this.populate_object(value,parent,extra,frag);
        
        //if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
        if (sibling){_dom_batch_.dom_batch_insertBefore(parent,frag,sibling);}else{_dom_batch_.dom_batch_append_child(parent,frag);}
        
        /*
        A REMETTRE DANS POPULATE_OBJET ET POPULATE_ARRAY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        value = this.convert_value (value, parent);
        
        //2: process fallback et empty
        
        //si un textnode, supprime
        if (frag.firstChild && frag.firstChild.nodeType===3) removeChildAndClearEvents(frag,frag.firstChild);//frag.removeChild(frag.firstChild);



        if (value == null){
                this._empty = true; //marque empty
                
                //si a des childs, supprime les tous
                while (frag.firstChild) {
                        //frag.removeChild(frag.firstChild);
                        removeChildAndClearEvents(frag,frag.firstChild);
                }
            
            
                if (this.fallback) {
                    //populate le model fallback
                    frag.appendChild(this._populate_model(CONTEXT, this.fallback, "fallback", false));
                }
            
                //replace l'element dans la page
                if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                return;
        }
        
        
        
        if (value.length == 0){
                  this._empty = true; //marque empty
                
                //si a des childs, supprime les tous
                while (frag.firstChild) {
                        //frag.removeChild(frag.firstChild);
                        removeChildAndClearEvents(frag,frag.firstChild);
                }
                if (this.empty ){                             
                    frag.appendChild(this._populate_model(CONTEXT, this.empty, "empty", false));
                }
                //replace l'element dans la page
                if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                return;
        }

        if (this._empty){
                //supprime la empty view
                while (frag.firstChild) {
                        //frag.removeChild(frag.firstChild);
                        removeChildAndClearEvents(frag,frag.firstChild);
                }
                this._empty = false;
                
        }
        
        
        
        //3: affiche les données
        //si ici, value!=null
        
        
        //3: si DBArray, populate array, sinon, object
        
        
        
        if (value.__proto__ == DBArray) this.populate_array(value,parent,extra, frag);
        else this.populate_object(value, parent, extra, frag);
        
        */
        
}  
    