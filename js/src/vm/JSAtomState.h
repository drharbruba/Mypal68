/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef vm_JSAtomState_h
#define vm_JSAtomState_h

#include "gc/Barrier.h"
#include "gc/Rooting.h"
#include "js/ProtoKey.h"
#include "js/Symbol.h"
#include "vm/CommonPropertyNames.h"

/* Various built-in or commonly-used names pinned on first context. */
struct JSAtomState {
#define PROPERTYNAME_FIELD(idpart, id, text) js::ImmutablePropertyNamePtr id;
  FOR_EACH_COMMON_PROPERTYNAME(PROPERTYNAME_FIELD)
#undef PROPERTYNAME_FIELD
#define PROPERTYNAME_FIELD(name, clasp) js::ImmutablePropertyNamePtr name;
  JS_FOR_EACH_PROTOTYPE(PROPERTYNAME_FIELD)
#undef PROPERTYNAME_FIELD
#define PROPERTYNAME_FIELD(name) js::ImmutablePropertyNamePtr name;
  JS_FOR_EACH_WELL_KNOWN_SYMBOL(PROPERTYNAME_FIELD)
#undef PROPERTYNAME_FIELD
#define PROPERTYNAME_FIELD(name) js::ImmutablePropertyNamePtr Symbol_##name;
  JS_FOR_EACH_WELL_KNOWN_SYMBOL(PROPERTYNAME_FIELD)
#undef PROPERTYNAME_FIELD

  js::ImmutablePropertyNamePtr* wellKnownSymbolNames() {
#define FIRST_PROPERTYNAME_FIELD(name) return &name;
    JS_FOR_EACH_WELL_KNOWN_SYMBOL(FIRST_PROPERTYNAME_FIELD)
#undef FIRST_PROPERTYNAME_FIELD
  }

  js::ImmutablePropertyNamePtr* wellKnownSymbolDescriptions() {
#define FIRST_PROPERTYNAME_FIELD(name) return &Symbol_##name;
    JS_FOR_EACH_WELL_KNOWN_SYMBOL(FIRST_PROPERTYNAME_FIELD)
#undef FIRST_PROPERTYNAME_FIELD
  }
};

namespace js {

#define NAME_OFFSET(name) offsetof(JSAtomState, name)

inline HandlePropertyName AtomStateOffsetToName(const JSAtomState& atomState,
                                                size_t offset) {
  return *reinterpret_cast<js::ImmutablePropertyNamePtr*>((char*)&atomState +
                                                          offset);
}

} /* namespace js */

#endif /* vm_JSAtomState_h */
