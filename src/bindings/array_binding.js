//--require model_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  array_binding.js:

*/
  
/*binding d'un array*/
function __array_binding(infos){
        __model_binding.call(this, infos);
        this._empty = false;   
}
__array_binding.prototype = new __model_binding ();

//@deprecated
__array_binding.prototype._clear_binding = function(bindings){
        //nettoie le binding
        for(key in bindings){

                //pour chq element de l'array
                //passe en context l'item!
                __notifyDatasetChanged(null,bindings[key], key);
        }
}

/*
Nettoie le html crée lors d'un precedent binding
recupere tout et met dans un stack pour reutilisation
*/
__array_binding.prototype._clean_child = function(child, root){

        if (child != null) {
            
                var current_keys = child._ftw2_keys;//chq model a ses keys!



                //TODO: supprime les cl�s de BINDINGS[PAGES_ID] cr�es precedement
                if(current_keys){

                    var model_bindings = [];
                    for (var key in current_keys){
                        //supprime de la page
                        current = current_keys[key];
                        for (bi=0;bi<current.length;bi++){
                            cr = current[bi];

                            index = BINDINGS[key].indexOf(cr);

                            test = BINDINGS[key].splice(index,1)[0];

                            model_bindings.push(test);//supprime des bindings
                            if(BINDINGS[key].length == 0) delete(BINDINGS[key]);

                        }

                    }
                }

            //de toute facon, remove child!
            root.removeChild(child);
        }
}
__array_binding.prototype.populate = function (value, context, extra){

        //definie les actions par defaut (ie: pas d'extras)

        //recupere l'element et place le dans un fragment pour eviter les reflows
        var fragment = document.createDocumentFragment();
        var sibling = this._element.nextSibling;

        var parent = this._element.parentNode;
        var frag = this._element;


        fragment.appendChild(frag);//ajoute directement l'element au fragment...

        //si un textnode, supprime
        if (frag.firstChild && frag.firstChild.nodeType===3) frag.removeChild(frag.firstChild);




        var value = this.convert_value (value, context);

        if (value == null){
                this._empty = true; //marque empty
                
                //si a des childs, supprime les tous
                while (frag.firstChild) {
                        frag.removeChild(frag.firstChild);
                }
            
            
                if (this.fallback) {
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
                        frag.removeChild(frag.firstChild);
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
                        frag.removeChild(frag.firstChild);
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
                    this._clean_child(frag.children[frag.children.length -1], frag);
                    //replace l'element dans la page
                    if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
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
                        result.__uuid__ = item.__uuid__;//pour pouvoir le retrouver plus tard...

                       frag.appendChild(result);
                    }
                    //replace l'element dans la page
                    if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}
                    return;
                }
                case 'SHIFT':{
                    //retire le premier element
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
                    var index=extra.index;
                    var howmany=extra.howmany;
                    var count = extra.count;
                    for (var ci=index;ci<index+howmany;ci++)this._clean_child(frag.children[ci],frag);//par defaut, supprime tous les childs de la liste

                    

                    //si doit ajouter en position...
                    if (count != undefined && count >0){
                        var add_childs = [];
                        var prec = frag.children[index];
                        for (var c=count - 1 ;c>=0; c--){add_childs.push( value[index+c]);}
                        for (var ci=0; ci<add_childs.length;ci++){
                            var item = add_childs[ci];
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
            this._clean_child(removeChilds[ci], frag);

        }


        //ajoute les nouveaux elements
        for (var ci=0; ci<value.length;ci
            var item = value[ci];
            var result = this._populate_item(item);
            frag.appendChild(result);
        }
        //affichage des groupes

        this._key_uuid_ = context.__uuid__+":"+this.from;
        //replace l'element dans la page
        if (sibling){ parent.insertBefore(frag, sibling);}else{parent.appendChild(frag);}

};



__array_binding.prototype._populate_item = function(context, parent, extra){
    
        if (context == null ){
                //modif, utilise le fallback comme data-type
                return this._process_fallback
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