/* Copyright 2020 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef wasm_context_h
#define wasm_context_h

#include "mozilla/MemoryReporting.h"
#include "jstypes.h"
#include "js/UniquePtr.h"

struct JS_PUBLIC_API JSContext;

namespace js {
namespace wasm {

class TypeContext;

// wasm::Context lives in JSContext and contains the wasm-related per-context
// state.

class Context {
 public:
  Context()
      : triedToInstallSignalHandlers(false),
        haveSignalHandlers(false),
        typeContext(nullptr) {}

  // Used by wasm::EnsureThreadSignalHandlers(cx) to install thread signal
  // handlers once per JSContext/thread.
  bool triedToInstallSignalHandlers;
  bool haveSignalHandlers;

  [[nodiscard]] bool ensureTypeContext(JSContext* cx);

  // The global type context.
  UniquePtr<TypeContext> typeContext;

  // about:memory reporting

  size_t sizeOfExcludingThis(mozilla::MallocSizeOf mallocSizeOf) const;
};

}  // namespace wasm
}  // namespace js

#endif  // wasm_context_h
