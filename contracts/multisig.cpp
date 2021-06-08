/*
 * @Description:
 * @Author: kay
 * @Date: 2021-06-01 11:00:48
 * @LastEditTime: 2021-06-07 17:52:59
 * @LastEditors: kay
 */

#include "multisig.hpp"

namespace dante {

void Multisig::init(const std::set<std::string>& managers,
                    const uint8_t& requires) {
  managers_.self() = managers;
  platon_assert(requires <= managers.size(), "requires exceed managers size.");
  requires_.self() = requires;
}

bool Multisig::propose(const std::string& proposal_name,
                       const std::string& contract_addr,
                       const std::string& to,
                       const u128& amount,
                       const int64_t& expiration) {
  std::string manager = platon_origin().toString();
  auto managers = managers_.self();
  platon_assert(managers.find(manager) != managers.end(),
                "only manager can propose.");
  platon_assert(!proposals_.contains(proposal_name) &&
                    !update_managers_.contains(proposal_name),
                proposal_name + " proposal already exists.");
  int64_t expire_time = expiration <= 0 ? platon_timestamp() + kMsecondsPerDay
                                        : platon_timestamp() + expiration;
  proposals_.insert(proposal_name,
                    Proposal{contract_addr, to, amount, expire_time});
  return true;
}

bool Multisig::approve(const std::string& proposal_name) {
  std::string manager = platon_origin().toString();
  auto managers = managers_.self();
  platon_assert(managers.find(manager) != managers.end(),
                "only manager can approve.");
  bool normal_proposal = proposals_.contains(proposal_name);
  bool upate_proposal = update_managers_.contains(proposal_name);
  platon_assert(proposals_.contains(proposal_name) ||
                    update_managers_.contains(proposal_name),
                "proposal not exists.");
  if (normal_proposal) {
    platon_assert(platon_timestamp() <= proposals_[proposal_name].expiration,
                  "proposal has expired.");
    approvers_[proposal_name].insert(manager);
  } else {
    update_managers_[proposal_name].approvers.insert(manager);
  }
  return true;
}

bool Multisig::add_managers(const std::string& proposal_name,
                            const std::set<std::string>& new_managers,
                            const uint8_t& requires) {
  std::string manager = platon_origin().toString();
  auto managers = managers_.self();
  platon_assert(!proposals_.contains(proposal_name) &&
                !update_managers_.contains(proposal_name));
  platon_assert(managers.find(manager) != managers.end(),
                "only manager can propose add manager proposal.");
  platon_assert(requires <= managers.size() + new_managers.size(),
                "requires exceed managers size.");
  update_managers_.insert(proposal_name,
                          Manager{new_managers, {}, 1, requires});
  return true;
}

bool Multisig::remove_managers(const std::string& proposal_name,
                               const std::set<std::string>& old_managers,
                               const uint8_t& requires) {
  std::string manager = platon_origin().toString();
  auto managers = managers_.self();
  platon_assert(!proposals_.contains(proposal_name) &&
                !update_managers_.contains(proposal_name));
  platon_assert(managers.find(manager) != managers.end(),
                "only manager can approve.");
  platon_assert(requires <= managers.size() - old_managers.size(),
                "requires exceed managers size.");
  update_managers_.insert(proposal_name,
                         Manager{old_managers, {}, 0, requires});
  return true;
}

bool Multisig::execute(const std::string& proposal_name) {
  bool result = true;
  if (proposals_.contains(proposal_name)) {
    platon_assert(approvers_[proposal_name].size() >= requires_.self(),
                  "not enough approvers");
    auto proposal = proposals_[proposal_name];
    auto to = make_address(proposal.to);
    if (!to.second) {
      return false;
    }
    auto contract = make_address(proposal.contract_addr);
    if (!contract.second) {
      return false;
    }
    if (contract.first == Address(0)) {
      result = platon_transfer(to.first, Energon(proposal.amount));
    } else {
      result = platon_call(contract.first, uint32_t(0), uint32_t(0), "transfer",
                           to.first, proposal.amount);
    }
    proposals_.erase(proposal_name);
    approvers_.erase(proposal_name);
  } else if (update_managers_.contains(proposal_name)) {
    auto update_proposal = update_managers_[proposal_name];
    platon_assert(update_proposal.approvers.size() >= requires_.self(),
                  "not enough approvers");
    if (update_proposal.action_type) {
      for (auto manager : update_proposal.managers) {
        managers_.self().insert(manager);
      }
    } else {
      for (auto manager : update_proposal.managers) {
        managers_.self().erase(manager);
      }
    }
    update_managers_.erase(proposal_name);
  } else {
    platon_assert(false, "proposal not exists.");
  }
  return result;
}

uint8_t Multisig::get_requires() {
  return requires_.self();
}

std::set<std::string> Multisig::get_managers() {
  return managers_.self();
}

Proposal Multisig::get_proposal(const std::string& proposal_name) {
  if (proposals_.contains(proposal_name)) {
    return proposals_[proposal_name];
  }
  return Proposal{};
}

Manager Multisig::get_update_managers_proposal(
    const std::string& proposal_name) {
  if (update_managers_.contains(proposal_name)) {
    return update_managers_[proposal_name];
  }
  return Manager{};
}

std::set<std::string> Multisig::get_approval(const std::string& proposal_name) {
  if (approvers_.contains(proposal_name)) {
    return approvers_[proposal_name];
  } else if (update_managers_.contains(proposal_name)) {
    return update_managers_[proposal_name].approvers;
  } else {
    return std::set<std::string>();
  }
}

}  // namespace dante